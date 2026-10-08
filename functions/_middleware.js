// Cloudflare Pages runs this before every page, asset, and API request.
// Keep public/_routes.json on /* so static files cannot bypass the gate.
const encoder = new TextEncoder();
const COOKIE = "tofu_study_session";
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const TRACK_COUNTS = [14, 18, 28, 14, 22];
const TYPES = {
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8"
};

function reply(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...headers
  } });
}
function json(value, status = 200, headers = {}) {
  return reply(JSON.stringify(value), status, { "Content-Type": "application/json; charset=utf-8", ...headers });
}
function sameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
async function passwordMatches(given, expected) {
  return bytesEqual(await digest(given), await digest(expected));
}
function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid token");
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function signature(message, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}
async function issueSession(role, secret) {
  const payload = base64url(encoder.encode(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  return `${payload}.${base64url(await signature(payload, secret))}`;
}
async function readSession(request, secret) {
  const cookie = request.headers.get("Cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  const token = cookie?.slice(COOKIE.length + 1);
  if (!token || token.length > 1000) return null;
  try {
    const [payload, supplied, extra] = token.split(".");
    if (!payload || !supplied || extra) return null;
    if (!bytesEqual(unbase64url(supplied), await signature(payload, secret))) return null;
    const session = JSON.parse(new TextDecoder().decode(unbase64url(payload)));
    if (!["reader", "admin"].includes(session.role) || !Number.isSafeInteger(session.exp) || session.exp <= Date.now() / 1000) return null;
    return session;
  } catch { return null; }
}
function sessionCookie(request, token, maxAge) {
  const hostname = new URL(request.url).hostname;
  const secure = hostname === "localhost" || hostname === "127.0.0.1" ? "" : "; Secure";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
function isTrackForLesson(id, lesson) {
  if (!id) return true;
  const match = /^L(0[0-4])-(\d{2})$/.exec(id);
  return Boolean(match && Number(match[1]) === lesson && Number(match[2]) >= 1 && Number(match[2]) <= TRACK_COUNTS[lesson]);
}
function titleOf(value) {
  return value.trim().slice(0, 120).replace(/[\u0000-\u001f\u007f]/g, "");
}
function materialRecord(object) {
  const meta = object.customMetadata || {};
  const id = /^materials\/([0-9a-f-]{36})\.(mp3|pdf|txt|md)$/.exec(object.key)?.[1];
  if (!id || !/^[0-4]$/.test(meta.lesson || "")) return null;
  return {
    id, lesson: Number(meta.lesson), trackId: meta.trackId || "",
    title: meta.title || `Material ${id.slice(0, 8)}`,
    name: meta.name || `material.${meta.extension || "txt"}`,
    type: meta.extension || "txt", size: object.size,
    uploaded: object.uploaded?.toISOString?.() || ""
  };
}
async function listMaterials(bucket) {
  const items = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix: "materials/", limit: 1000, cursor, include: ["customMetadata"] });
    for (const object of page.objects) {
      const record = materialRecord(object);
      if (record) items.push(record);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && items.length < 5000);
  return items.sort((a, b) => a.lesson - b.lesson || a.title.localeCompare(b.title));
}
async function uploadMaterial(request, bucket) {
  const length = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES + 100_000) return json({ error: "File is too large (50 MB maximum)." }, 413);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "Invalid upload." }, 400); }
  const file = form.get("file");
  const title = titleOf(String(form.get("title") || ""));
  const lesson = Number(form.get("lesson"));
  const trackId = String(form.get("trackId") || "").trim().toUpperCase();
  if (!(file instanceof File) || !file.size || file.size > MAX_UPLOAD_BYTES) return json({ error: "Choose a file up to 50 MB." }, 400);
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!Object.hasOwn(TYPES, extension)) return json({ error: "Use an MP3, PDF, TXT, or MD file." }, 400);
  if (!title || !Number.isInteger(lesson) || lesson < 0 || lesson > 4 || !isTrackForLesson(trackId, lesson)) return json({ error: "Check the title, lesson, and track number." }, 400);
  if (extension === "mp3" && !trackId) return json({ error: "Choose the matching track number for an MP3." }, 400);
  const id = crypto.randomUUID();
  const key = `materials/${id}.${extension}`;
  await bucket.put(key, file, {
    httpMetadata: { contentType: TYPES[extension] },
    customMetadata: { title, lesson: String(lesson), trackId, name: titleOf(file.name), extension }
  });
  return json({ ok: true, id }, 201);
}
async function serveMaterial(request, bucket, url) {
  const id = url.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "File not found." }, 404);
  for (const extension of Object.keys(TYPES)) {
    const rangeHeader = request.headers.get("Range");
    if (rangeHeader && !/^bytes=(\d+-\d*|-\d+)$/.test(rangeHeader)) return reply(null, 416);
    const object = await bucket.get(`materials/${id}.${extension}`, rangeHeader ? { range: request.headers } : undefined);
    if (!object) continue;
    const headers = {
      "Content-Type": TYPES[extension],
      "Content-Disposition": `inline; filename="material.${extension}"`,
      "Accept-Ranges": "bytes"
    };
    if (object.httpEtag) headers.ETag = object.httpEtag;
    if (object.range) {
      const offset = object.range.offset ?? object.size - object.range.suffix;
      const length = Math.min(object.range.length ?? object.range.suffix ?? object.size - offset, object.size - offset);
      headers["Content-Range"] = `bytes ${offset}-${offset + length - 1}/${object.size}`;
      headers["Content-Length"] = String(length);
      return reply(request.method === "HEAD" ? null : object.body, 206, headers);
    }
    headers["Content-Length"] = String(object.size);
    return reply(request.method === "HEAD" ? null : object.body, 200, headers);
  }
  return json({ error: "File not found." }, 404);
}

// The sign-in page has no external assets, so it works while all other assets stay private.
function loginPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Tofu · Japanese study</title><style>
:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f0e7;color:#202626;font-family:system-ui,"Hiragino Kaku Gothic ProN",sans-serif;padding:22px}.card{width:min(100%,410px);padding:38px;background:#fffdf8;border:1px solid #ded8cc;border-radius:20px;box-shadow:0 16px 42px #352a1b11}.mark{display:grid;place-items:center;width:52px;height:52px;border-radius:14px;background:#a73e32;color:white;font:32px serif}h1{font:500 31px Georgia,serif;margin:22px 0 10px}p{color:#68706d;line-height:1.6;font-size:14px}label{display:block;font-size:12px;font-weight:700;margin-top:23px}input,select,button{font:inherit}input{width:100%;padding:13px;border:1px solid #cfc8bc;border-radius:9px;margin:8px 0 15px;background:white;color:#202626}button{width:100%;padding:12px;border:0;border-radius:9px;background:#a73e32;color:white;font-weight:750;cursor:pointer}button:disabled{opacity:.65;cursor:wait}select{border:1px solid #ded8cc;border-radius:8px;padding:7px;background:white;color:#202626;float:right}.error{min-height:1.5em;color:#982d22}@media(prefers-color-scheme:dark){body{background:#111b22;color:#eef1e8}.card{background:#20313a;border-color:#3a4b51}p{color:#b1bcb8}input,select{background:#182630;color:#eef1e8;border-color:#3a4b51}}
  </style></head><body><main class="card"><span class="mark" aria-hidden="true">学</span><select id="language" aria-label="Language"><option value="en">English</option><option value="ja">日本語</option><option value="zh">中文</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option></select><h1 id="title">A quiet place to study.</h1><p id="lead">Enter the study password to open lessons 0–4.</p><form id="form"><label for="password" id="label">Password</label><input id="password" type="password" autocomplete="current-password" required maxlength="256"><button id="submit" type="submit">Open study room</button><p class="error" id="error" role="alert"></p></form></main><script>
const copy={en:["A quiet place to study.","Enter the study password to open lessons 0–4.","Password","Open study room","Incorrect password. Please try again."],ja:["日本語を学ぶ場所。","学習用パスワードを入力して、第0〜4課を開きます。","パスワード","学習室を開く","パスワードが違います。もう一度お試しください。"],zh:["安静学习日语。","输入学习密码，打开第0至4课。","密码","进入学习空间","密码错误，请重试。"],es:["Un espacio para estudiar.","Introduce la contraseña para abrir las lecciones 0–4.","Contraseña","Entrar","Contraseña incorrecta. Inténtalo de nuevo."],fr:["Un espace pour étudier.","Saisissez le mot de passe pour ouvrir les leçons 0 à 4.","Mot de passe","Entrer","Mot de passe incorrect. Réessayez."],de:["Ein ruhiger Ort zum Lernen.","Gib das Passwort ein, um Lektion 0–4 zu öffnen.","Passwort","Lernraum öffnen","Falsches Passwort. Versuche es erneut."]};const select=document.querySelector("#language"),form=document.querySelector("#form"),error=document.querySelector("#error");try{select.value=localStorage.getItem("jss-language")||"en"}catch{}function language(){const words=copy[select.value]||copy.en;document.documentElement.lang=select.value;document.title=words[0]+" · Tofu";["title","lead","label","submit"].forEach((id,i)=>document.getElementById(id).textContent=words[i]);error.textContent=""}select.addEventListener("change",()=>{try{localStorage.setItem("jss-language",select.value)}catch{}language()});language();form.addEventListener("submit",async event=>{event.preventDefault();const button=document.querySelector("#submit");button.disabled=true;error.textContent="";try{const response=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:document.querySelector("#password").value})});if(response.ok){location.replace("/");return}error.textContent=(copy[select.value]||copy.en)[4]}catch{error.textContent=(copy[select.value]||copy.en)[4]}finally{button.disabled=false}});
  </script></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!env.SITE_PASSWORD || !env.ADMIN_PASSWORD || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || env.ADMIN_PASSWORD === env.SITE_PASSWORD) {
    return reply("Site setup is incomplete. Set three distinct Cloudflare secrets as described in README.md.", 503, { "Content-Type": "text/plain; charset=utf-8" });
  }
  if (url.pathname === "/api/login") {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
    if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
    const length = Number(request.headers.get("Content-Length"));
    if (Number.isFinite(length) && length > 4096) return json({ error: "Invalid request." }, 400);
    let body;
    try { const raw = await request.text(); if (raw.length > 4096) return json({ error: "Invalid request." }, 400); body = JSON.parse(raw); } catch { return json({ error: "Invalid request." }, 400); }
    if (typeof body?.password !== "string" || body.password.length > 256) return json({ error: "Invalid request." }, 400);
    const [admin, reader] = await Promise.all([passwordMatches(body.password, env.ADMIN_PASSWORD), passwordMatches(body.password, env.SITE_PASSWORD)]);
    const role = admin ? "admin" : reader ? "reader" : null;
    if (!role) return json({ error: "Incorrect password." }, 401);
    return json({ ok: true, role }, 200, { "Set-Cookie": sessionCookie(request, await issueSession(role, env.SESSION_SECRET), SESSION_SECONDS) });
  }
  const session = await readSession(request, env.SESSION_SECRET);
  if (url.pathname === "/api/logout") {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { Allow: "POST" });
    if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(request, "", 0) });
  }
  if (url.pathname === "/api/session") return session ? json({ authenticated: true, role: session.role }) : json({ authenticated: false }, 401);
  if (!session) {
    const acceptsHtml = request.headers.get("Accept")?.includes("text/html");
    if (request.method === "GET" && !url.pathname.startsWith("/api/") && (url.pathname === "/" || url.pathname.endsWith(".html") || acceptsHtml)) {
      return reply(loginPage(), 200, { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" });
    }
    return json({ error: "Sign in required." }, 401);
  }
  context.data.role = session.role;
  if (url.pathname === "/api/materials") {
    if (!env.MATERIALS) return json({ error: "Private material storage is not configured." }, 503);
    if (request.method === "GET") return json({ items: await listMaterials(env.MATERIALS) });
    if (request.method === "POST") {
      if (session.role !== "admin") return json({ error: "Admin access required." }, 403);
      if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
      return uploadMaterial(request, env.MATERIALS);
    }
    return json({ error: "Method not allowed." }, 405, { Allow: "GET, POST" });
  }
  if (url.pathname === "/api/materials/file") {
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Method not allowed." }, 405, { Allow: "GET, HEAD" });
    if (!env.MATERIALS) return json({ error: "Private material storage is not configured." }, 503);
    return serveMaterial(request, env.MATERIALS, url);
  }
  if (url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
