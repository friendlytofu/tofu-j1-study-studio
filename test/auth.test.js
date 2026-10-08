import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const origin = 'https://study.example';
const secrets = {
  SITE_PASSWORD: 'reader test phrase',
  ADMIN_PASSWORD: 'a separate admin test phrase',
  SESSION_SECRET: 'local testing key that is over thirty-two characters'
};

class MemoryBucket {
  objects = new Map();
  async put(key, file, options) {
    this.objects.set(key, { data: new Uint8Array(await file.arrayBuffer()), ...options });
  }
  async list() {
    return { objects: [...this.objects].map(([key, value]) => ({ key, size: value.data.length, customMetadata: value.customMetadata, uploaded: new Date() })), truncated: false };
  }
  async get(key, options) {
    const value = this.objects.get(key);
    if (!value) return null;
    const size = value.data.length;
    let offset = 0, length = size, range;
    const requested = options?.range?.get('Range');
    if (requested) {
      const [, start, end] = /^bytes=(\d+)-(\d*)$/.exec(requested) || [];
      offset = Number(start);
      length = end ? Number(end) - offset + 1 : size - offset;
      range = { offset, length };
    }
    return { body: new Response(value.data.slice(offset, offset + length)).body, size, range, httpEtag: '"test"' };
  }
}

function call(path, { method = 'GET', headers = {}, body, cookie, env = secrets, bucket = new MemoryBucket(), next } = {}) {
  const request = new Request(origin + path, {
    method, headers: { ...(method === 'POST' ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body
  });
  return onRequest({ request, env: { ...env, MATERIALS: bucket }, data: {}, next: next || (() => new Response('protected asset')) });
}
async function signIn(password) {
  const response = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  assert.equal(response.status, 200);
  return response.headers.get('Set-Cookie').split(';')[0];
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

test('reader can view pages but cannot upload; admin can upload exact tracks', async () => {
  const bucket = new MemoryBucket();
  const reader = await signIn(secrets.SITE_PASSWORD);
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  assert.equal((await call('/app.js', { cookie: reader })).status, 200);
  assert.equal((await call('/api/session', { cookie: reader }).then((r) => r.json())).role, 'reader');
  assert.equal((await call('/api/session', { cookie: admin }).then((r) => r.json())).role, 'admin');
  const form = new FormData();
  form.set('title', 'Lesson 4 recording');
  form.set('lesson', '4');
  form.set('trackId', 'L04-01');
  form.set('file', new File(['1234567890'], 'L04-01.mp3', { type: 'audio/mpeg' }));
  assert.equal((await call('/api/materials', { method: 'POST', cookie: reader, body: form, bucket })).status, 403);
  const uploaded = await call('/api/materials', { method: 'POST', cookie: admin, body: form, bucket });
  assert.equal(uploaded.status, 201);
  const { items } = await (await call('/api/materials', { cookie: reader, bucket })).json();
  assert.equal(items.length, 1);
  assert.equal(items[0].trackId, 'L04-01');
  const file = await call(`/api/materials/file?id=${items[0].id}`, { cookie: reader, bucket, headers: { Range: 'bytes=2-5' } });
  assert.equal(file.status, 206);
  assert.equal(file.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(file.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(await file.text(), '3456');
  const bad = new FormData();
  bad.set('title', 'Wrong mapping'); bad.set('lesson', '3'); bad.set('trackId', 'L04-01');
  bad.set('file', new File(['abc'], 'L04-01.mp3'));
  assert.equal((await call('/api/materials', { method: 'POST', cookie: admin, body: bad, bucket })).status, 400);
});

test('tampered sessions, cross-origin uploads, and signed-out sessions are denied', async () => {
  const admin = await signIn(secrets.ADMIN_PASSWORD);
  const tampered = admin.slice(0, -1) + (admin.endsWith('A') ? 'B' : 'A');
  assert.equal((await call('/api/materials', { cookie: tampered })).status, 401);
  const form = new FormData(); form.set('title', 'X');
  assert.equal((await call('/api/materials', { method: 'POST', cookie: admin, body: form, headers: { Origin: 'https://elsewhere.example' } })).status, 403);
  const logout = await call('/api/logout', { method: 'POST', cookie: admin });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
});
