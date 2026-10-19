import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './server.mjs';

async function start(t, options = {}) {
  const server = createApp({ dataFile: null, getBooks: async () => [{ id: '1', price: 89000 }, { id: '2', price: 75000 }], ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (path, method = 'GET', body, token) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json() };
  };
}
const account = { name: 'Sinh viên', email: 'student@example.test', password: 'password-test-123' };

test('auth: validation, register, duplicate, login, /me and logout revocation', async t => {
  const call = await start(t);
  assert.equal((await call('/auth/register', 'POST', { ...account, email: 'invalid' })).status, 400);
  assert.equal((await call('/auth/register', 'POST', { ...account, password: '123' })).status, 400);
  const registered = await call('/auth/register', 'POST', account);
  assert.equal(registered.status, 201); assert.ok(registered.data.token); assert.equal(registered.data.user.name, account.name);
  assert.equal(registered.data.user.passwordHash, undefined);
  assert.equal((await call('/auth/register', 'POST', account)).status, 409);
  assert.equal((await call('/auth/login', 'POST', { ...account, password: 'wrong-pass' })).status, 401);
  const login = await call('/auth/login', 'POST', { ...account, email: '  STUDENT@example.test ' });
  assert.equal(login.status, 200);
  assert.equal((await call('/auth/me', 'GET', undefined, login.data.token)).data.email, account.email);
  assert.equal((await call('/auth/me', 'GET', undefined, 'broken-token')).status, 401);
  assert.equal((await call('/auth/logout', 'POST', {}, login.data.token)).status, 200);
  assert.equal((await call('/auth/me', 'GET', undefined, login.data.token)).status, 401);
});
test('expired token is rejected by /me and protected POST', async t => {
  const call = await start(t, { sessionTtl: -1 });
  const { data } = await call('/auth/register', 'POST', account);
  assert.equal((await call('/auth/me', 'GET', undefined, data.token)).status, 401);
  assert.equal((await call('/books/1/reviews', 'POST', { rating: 5, content: 'Hay' }, data.token)).status, 401);
});
test('reviews: empty state, authentication, validation, append once and isolation by book', async t => {
  const call = await start(t);
  assert.deepEqual((await call('/books/1/reviews')).data, []);
  const payload = { rating: 5, content: 'Sách rất hay!' };
  assert.equal((await call('/books/1/reviews', 'POST', payload)).status, 401);
  const { data: { token } } = await call('/auth/register', 'POST', account);
  for (const invalid of [{ rating: 0, content: 'a' }, { rating: 6, content: 'a' }, { rating: 2.5, content: 'a' }, { rating: 5, content: ' ' }]) {
    assert.equal((await call('/books/1/reviews', 'POST', invalid, token)).status, 400);
  }
  const created = await call('/books/1/reviews', 'POST', payload, token);
  assert.equal(created.status, 201); assert.equal(created.data.user.name, account.name);
  const reviews = (await call('/books/1/reviews')).data;
  assert.equal(reviews.length, 1); assert.equal(reviews[0].id, created.data.id);
  assert.deepEqual((await call('/books/2/reviews')).data, []);
  assert.equal((await call('/books/missing/reviews')).status, 404);
});
test('checkout: requires auth and computes prices on server', async t => {
  const call = await start(t);
  const payload = { items: [{ bookId: '1', quantity: 2 }], total: 1 };
  assert.equal((await call('/orders', 'POST', payload)).status, 401);
  const { data: { token } } = await call('/auth/register', 'POST', account);
  assert.equal((await call('/orders', 'POST', { items: [] }, token)).status, 400);
  assert.equal((await call('/orders', 'POST', { items: [{ bookId: '1', quantity: -1 }] }, token)).status, 400);
  const result = await call('/orders', 'POST', payload, token);
  assert.equal(result.status, 201); assert.equal(result.data.total, 178000);
});
test('accounts, reviews and sessions survive backend restart; passwords are hashed', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'bookstore-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const dataFile = join(directory, 'db.json');
  const first = await start(t, { dataFile });
  const { data: { token } } = await first('/auth/register', 'POST', account);
  await first('/books/1/reviews', 'POST', { rating: 4, content: 'Đáng đọc' }, token);
  const disk = readFileSync(dataFile, 'utf8');
  assert.ok(!disk.includes(account.password));
  assert.ok(JSON.parse(disk).users[0].passwordHash);
  const restarted = await start(t, { dataFile });
  assert.equal((await restarted('/auth/me', 'GET', undefined, token)).status, 200);
  assert.equal((await restarted('/books/1/reviews')).data.length, 1);
});
