import type { Book } from '../types';

export function normalizeBooks(data: unknown): Book[] {
  if (!Array.isArray(data)) throw new Error('API sách không trả về danh sách hợp lệ.');
  const ids = new Set<string>();
  return data.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Dữ liệu sách không hợp lệ.');
    const raw = item as Record<string, unknown>;
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    const author = typeof raw.author === 'string' ? raw.author.trim() : '';
    const price = raw.price === null || raw.price === '' ? NaN : Number(raw.price);
    if (!title || !Number.isFinite(price) || price < 0) throw new Error('Sách thiếu tên hoặc giá hợp lệ.');
    const id = typeof raw.id === 'string' || typeof raw.id === 'number' ? String(raw.id) : `source:${JSON.stringify([title, author])}`;
    if (!id || ids.has(id)) throw new Error('API có sách trùng khóa. Cần bổ sung id riêng cho từng sách.');
    ids.add(id);
    return {
      id, title, author, price,
      category: raw.categoryId != null ? String(raw.categoryId) : typeof raw.category === 'string' ? raw.category : '',
      cover: typeof raw.image === 'string' ? raw.image : typeof raw.cover === 'string' ? raw.cover : '',
      description: typeof raw.description === 'string' ? raw.description : '',
    };
  });
}
