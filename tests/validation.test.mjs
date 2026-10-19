import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuth, averageRating } from '../src/utils/validation.ts';
import { normalizeBooks } from '../src/services/catalog.ts';
test('MockAPI: maps image/categoryId and keeps missing-id books stable after reordering', () => {
  const a = { title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', image: 'https://example.test/book.png', price: 85000, categoryId: '1' };
  const b = { title: 'Clean Code', author: 'Robert C. Martin', price: '420000', categoryId: '4' };
  const first = normalizeBooks([a, b]);
  const reordered = normalizeBooks([b, a]);
  assert.equal(first[0].id, reordered[1].id);
  assert.notEqual(first[0].id, first[1].id);
  assert.equal(first[0].cover, a.image);
  assert.equal(first[0].category, '1');
  assert.equal(first[1].price, 420000);
  assert.equal(normalizeBooks([{ ...a, id: 'real-id' }])[0].id, 'real-id');
  assert.throws(() => normalizeBooks([a, a]));
  assert.throws(() => normalizeBooks({ error: 'invalid' }));
});
test('TC01–02: inline validation fields and confirmation', () => {
  assert.ok(validateAuth('wrong', '123').email);
  assert.ok(validateAuth('a@example.test', '123').password);
  assert.ok(validateAuth('a@example.test', '123456', '654321', 'Name').confirm);
  assert.ok(validateAuth('a@example.test', '123456', '123456', '').name);
  assert.deepEqual(validateAuth(' a@example.test ', '123456', '123456', 'Name'), {});
});
test('TC11–12: average handles empty and invalid ratings without NaN', () => {
  assert.deepEqual(averageRating([]), { count: 0, average: 0 });
  assert.deepEqual(averageRating([{ rating: 5 }, { rating: 4 }, { rating: NaN }, { rating: 8 }, { rating: 0 }]), { count: 2, average: 4.5 });
});
