import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const origin = 'https://study.example';
const secrets = {
  SITE_PASSWORD: 'reader test phrase',
  ADMIN_PASSWORD: 'a separate admin test phrase',
  SESSION_SECRET: 'local testing key that is over thirty-two characters'
};
const chunkBytes = 8 * 1024 * 1024;

class MemoryKV {
  entries = new Map();
  async put(key, value, options = {}) {
    const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
    this.entries.set(key, { bytes: bytes.slice(), metadata: options.metadata });
  }
  async get(key, type = 'text') {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (type === 'arrayBuffer') return entry.bytes.slice().buffer;
    const text = new TextDecoder().decode(entry.bytes);
    return type === 'json' ? JSON.parse(text) : text;
  }
  async list({ prefix }) {
    return {
      keys: [...this.entries].filter(([key]) => key.startsWith(prefix)).map(([name, entry]) => ({ name, metadata: entry.metadata })),
      list_complete: true
    };
  }
  async delete(key) { this.entries.delete(key); }
}

function call(path, { method = 'GET', headers = {}, body, cookie, env = secrets, kv = new MemoryKV(), next } = {}) {
  const request = new Request(origin + path, {
    method, headers: { ...(method === 'POST' ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body
  });
  return onRequest({ request, env: { ...env, MATERIALS_KV: kv }, data: {}, next: next || (() => new Response('protected asset')) });
}
async function signIn(password) {
  const response = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  assert.equal(response.status, 200);
  return response.headers.get('Set-Cookie').split(';')[0];
}
function uploadForm({ title = 'Lesson 4 recording', lesson = '4', trackId = 'L04-01', bytes = new TextEncoder().encode('0123456789') } = {}) {
  const form = new FormData();
  form.set('title', title);
  form.set('lesson', lesson);
  form.set('trackId', trackId);
  form.set('file', new File([bytes], 'L04-01.mp3', { type: 'audio/mpeg' }));
  return form;
}

test('every site asset and API file is gated before the static handler', async () => {
  let calls = 0;
  const next = () => { calls++; return new Response('leak'); };
  assert.equal((await call('/app.js', { next })).status, 401);
  assert.equal((await call('/content.json', { next })).status, 401);
  assert.equal((await call('/api/materials/file?id=00000000-0000-0000-0000-000000000000', { next })).status, 401);
  assert.equal(calls, 0);
  const login = await call('/', { headers: { Accept: 'text/html' }, next });
  assert.equal(login.status, 200);
  assert.match(await login.text(), /type="password"/);
  assert.equal(calls, 0);
});

test('missing or unsafe secrets fail closed', async () => {
  assert.equal((await call('/', { env: { ...secrets, SESSION_SECRET: '' } })).status, 503);
  assert.equal((await call('/', { env: { ...secrets, ADMIN_PASSWORD: secrets.SITE_PASSWORD } })).status, 503);
});

test('wrong password and cross-origin login cannot open the site', async () => {
  const wrong = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'wrong' }) });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.has('Set-Cookie'), false);
  const crossOrigin = await call('/api/login', { method: 'POST', headers: { Origin: 'https://elsewhere.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ password: secrets.SITE_PASSWORD }) });
  assert.equal(crossOrigin.status, 403);
});

test('reader can view pages and files but cannot upload; admin must choose an exact track', async () => {
  const kv = new MemoryKV();
  const reader = await signIn(secrets.SITE_PASSWORD);
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  assert.equal((await call('/app.js', { cookie: reader })).status, 200);
  assert.equal((await call('/api/session', { cookie: reader }).then((r) => r.json())).role, 'reader');
  assert.equal((await call('/api/session', { cookie: admin }).then((r) => r.json())).role, 'admin');
  assert.equal((await call('/api/materials', { method: 'POST', cookie: reader, body: uploadForm(), kv })).status, 403);
  const uploaded = await call('/api/materials', { method: 'POST', cookie: admin, body: uploadForm(), kv });
  assert.equal(uploaded.status, 201);
  const { items } = await (await call('/api/materials', { cookie: reader, kv })).json();
  assert.equal(items.length, 1);
  assert.equal(items[0].trackId, 'L04-01');
  assert.equal([...kv.entries].filter(([key]) => key.startsWith('materials:chunk:')).length, 1);
  const file = await call(`/api/materials/file?id=${items[0].id}`, { cookie: reader, kv, headers: { Range: 'bytes=2-5' } });
  assert.equal(file.status, 206);
  assert.equal(file.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(file.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await file.text(), '2345');
  assert.equal((await call('/api/materials', { method: 'POST', cookie: admin, body: uploadForm({ lesson: '3' }), kv })).status, 400);
  assert.equal((await call('/api/materials', { cookie: admin, kv: null })).status, 503);
});

test('files crossing KV pieces support complete, bounded, and suffix reads', async () => {
  const kv = new MemoryKV();
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  const bytes = new Uint8Array(chunkBytes + 12);
  bytes.fill(65); bytes.set(new TextEncoder().encode('abcdefghijkl'), chunkBytes);
  const uploaded = await call('/api/materials', { method: 'POST', cookie: admin, body: uploadForm({ bytes }), kv });
  assert.equal(uploaded.status, 201);
  const { id } = (await uploaded.json()).item;
  assert.equal([...kv.entries].filter(([key]) => key.startsWith('materials:chunk:')).length, 2);
  const cross = await call(`/api/materials/file?id=${id}`, { cookie: admin, kv, headers: { Range: `bytes=${chunkBytes - 2}-${chunkBytes + 2}` } });
  assert.equal(cross.status, 206);
  assert.equal(await cross.text(), 'AAabc');
  const suffix = await call(`/api/materials/file?id=${id}`, { cookie: admin, kv, headers: { Range: 'bytes=-4' } });
  assert.equal(suffix.status, 206);
  assert.equal(await suffix.text(), 'ijkl');
  const head = await call(`/api/materials/file?id=${id}`, { method: 'HEAD', cookie: admin, kv });
  assert.equal(head.headers.get('Content-Length'), String(bytes.length));
  const invalid = await call(`/api/materials/file?id=${id}`, { cookie: admin, kv, headers: { Range: 'bytes=999999999-' } });
  assert.equal(invalid.status, 416);
});

test('owner can share an unnumbered text file for a lesson', async () => {
  const kv = new MemoryKV();
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  const reader = await signIn(secrets.SITE_PASSWORD);
  const form = new FormData();
  form.set('title', 'Lesson notes'); form.set('lesson', '2'); form.set('trackId', '');
  form.set('file', new File(['日本語のメモ'], 'notes.txt', { type: 'text/plain' }));
  const uploaded = await call('/api/materials', { method: 'POST', cookie: admin, body: form, kv });
  assert.equal(uploaded.status, 201);
  const { id } = (await uploaded.json()).item;
  const file = await call(`/api/materials/file?id=${id}`, { cookie: reader, kv });
  assert.equal(file.status, 200);
  assert.match(file.headers.get('Content-Type'), /^text\/plain/);
  assert.equal(await file.text(), '日本語のメモ');
});

test('tampered sessions, cross-origin uploads, and signed-out sessions are denied', async () => {
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  const tampered = admin.slice(0, -1) + (admin.endsWith('A') ? 'B' : 'A');
  assert.equal((await call('/api/materials', { cookie: tampered })).status, 401);
  assert.equal((await call('/api/materials', { method: 'POST', cookie: admin, body: uploadForm(), headers: { Origin: 'https://elsewhere.example' } })).status, 403);
  const logout = await call('/api/logout', { method: 'POST', cookie: admin });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
});
