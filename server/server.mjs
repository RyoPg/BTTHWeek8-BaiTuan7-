import { createServer } from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeBooks } from '../src/services/catalog.ts';

async function fetchCatalog() {
  try {
    const base = process.env.EXPO_PUBLIC_BOOK_API_URL || 'https://6ad5b90148476c0785d99fea.mockapi.io';
    const response = await fetch(`${base.replace(/\/$/, '')}/Book`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Catalog request failed');
    return normalizeBooks(await response.json());
  } catch { throw Object.assign(new Error('Không tải được danh mục sách từ MockAPI. Vui lòng thử lại.'), { status: 502 }); }
}
const publicUser = ({ id, name, email }) => ({ id, name, email });
export function createApp({ dataFile = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json'), sessionTtl = 7 * 24 * 60 * 60 * 1000, getBooks = fetchCatalog } = {}) {
  let db = dataFile && existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : { users: [], sessions: [], reviews: [], orders: [] };
  function save() { if (dataFile) { mkdirSync(dirname(dataFile), { recursive: true }); writeFileSync(dataFile, JSON.stringify(db, null, 2)); } }
  function fail(status, message) { throw Object.assign(new Error(message), { status }); }
  function session(user) {
    const token = randomBytes(32).toString('hex');
    db.sessions.push({ token, userId: user.id, expiresAt: Date.now() + sessionTtl });
    save(); return { token, user: publicUser(user) };
  }
  return createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    function send(status, data) { res.writeHead(status); res.end(JSON.stringify(data)); }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      let body = {};
      if (req.method === 'POST') {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 20000) fail(413, 'Dữ liệu quá lớn.'); }
        try { body = JSON.parse(raw || '{}'); } catch { fail(400, 'JSON không hợp lệ.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Dữ liệu không hợp lệ.');
      }
      function requireUser() {
        const token = req.headers.authorization?.replace(/^Bearer /, '');
        const current = db.sessions.find(s => s.token === token && s.expiresAt > Date.now());
        const user = current && db.users.find(u => u.id === current.userId);
        if (!user) fail(401, 'Phiên không hợp lệ hoặc hết hạn.');
        return user;
      }
      if (req.method === 'POST' && ['/auth/register', '/auth/login'].includes(path)) {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof body.password !== 'string' || body.password.length < 6 || body.password.length > 200) fail(400, 'Email hoặc mật khẩu không hợp lệ (6–200 ký tự).');
        let user = db.users.find(u => u.email === email);
        if (path === '/auth/register') {
          if (typeof body.name !== 'string' || !body.name.trim()) fail(400, 'Vui lòng nhập tên.');
          if (user) fail(409, 'Email đã được đăng ký.');
          const salt = randomBytes(16).toString('hex');
          user = { id: randomUUID(), email, name: body.name.trim().slice(0, 100), salt, passwordHash: scryptSync(body.password, salt, 64).toString('hex') };
          db.users.push(user);
        } else {
          if (!user || !timingSafeEqual(Buffer.from(user.passwordHash, 'hex'), scryptSync(body.password, user.salt, 64))) fail(401, 'Email hoặc mật khẩu không đúng.');
        }
        send(path === '/auth/register' ? 201 : 200, session(user)); return;
      }
      if (req.method === 'GET' && path === '/auth/me') { send(200, publicUser(requireUser())); return; }
      if (req.method === 'POST' && path === '/auth/logout') {
        requireUser(); db.sessions = db.sessions.filter(s => `Bearer ${s.token}` !== req.headers.authorization); save(); send(200, { ok: true }); return;
      }
      if (req.method === 'GET' && path === '/books') { send(200, await getBooks()); return; }
      const match = path.match(/^\/books\/([^/]+)(\/reviews)?$/);
      if (match) {
        const books = await getBooks();
        const book = books.find(b => b.id === decodeURIComponent(match[1]));
        if (!book) fail(404, 'Không tìm thấy sách.');
        if (req.method === 'GET') { send(200, match[2] ? db.reviews.filter(r => r.bookId === book.id) : book); return; }
        if (match[2] && req.method === 'POST') {
          const user = requireUser();
          if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5 || typeof body.content !== 'string' || !body.content.trim() || body.content.length > 2000) fail(400, 'Chọn 1–5 sao và nhập bình luận tối đa 2000 ký tự.');
          const review = { id: randomUUID(), bookId: book.id, user: publicUser(user), rating: body.rating, content: body.content.trim(), createdAt: new Date().toISOString() };
          db.reviews.push(review); save(); send(201, review); return;
        }
      }
      if (path === '/orders' && req.method === 'POST') {
        const user = requireUser();
        if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) fail(400, 'Giỏ hàng không hợp lệ.');
        const books = await getBooks();
        const total = body.items.reduce((sum, item) => {
          const book = books.find(b => b.id === item?.bookId);
          if (!book || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) fail(400, 'Số lượng không hợp lệ.');
          return sum + book.price * item.quantity;
        }, 0);
        const order = { id: randomUUID(), userId: user.id, items: body.items, total, createdAt: new Date().toISOString() };
        db.orders.push(order); save(); send(201, { id: order.id, total }); return;
      }
      fail(404, 'Không tìm thấy endpoint.');
    } catch (error) { send(error.status || 500, { message: error.status ? error.message : 'Máy chủ gặp lỗi.' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log('Backend demo đang chạy tại cổng ' + (process.env.PORT || 3001)));
}
