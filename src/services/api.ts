import { create, isAxiosError } from 'axios';
import type { AuthResponse, Review, User, CartItem } from '../types';
import { normalizeBooks } from './catalog';

export const api = create({ baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001', timeout: 10000 });
const catalogApi = create({ baseURL: process.env.EXPO_PUBLIC_BOOK_API_URL || 'https://6ad5b90148476c0785d99fea.mockapi.io', timeout: 10000 });
let unauthorized: (() => void) | undefined;
export function onUnauthorized(handler?: () => void) { unauthorized = handler; }
export function setToken(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
api.interceptors.response.use(r => r, error => {
  if (error.response?.status === 401 && error.config?.headers?.Authorization === api.defaults.headers.common.Authorization) unauthorized?.();
  return Promise.reject(error);
});
export function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Thông tin đăng nhập sai hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
    if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.';
    return typeof error.response.data?.message === 'string' ? error.response.data.message : 'Máy chủ gặp lỗi. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
}
export const authService = {
  login: async (email: string, password: string) => (await api.post<AuthResponse>('/auth/login', { email, password })).data,
  register: async (name: string, email: string, password: string) => (await api.post<AuthResponse>('/auth/register', { name, email, password })).data,
  me: async () => (await api.get<User>('/auth/me')).data,
  logout: async () => { await api.post('/auth/logout'); },
};
export const bookService = {
  list: async () => normalizeBooks((await catalogApi.get('/Book')).data),
  detail: async (id: string) => {
    const books = normalizeBooks((await catalogApi.get('/Book')).data);
    const book = books.find(item => item.id === id);
    if (!book) throw new Error('Không tìm thấy sách.');
    return book;
  },
};
export const reviewService = {
  list: async (id: string) => (await api.get<Review[]>(`/books/${encodeURIComponent(id)}/reviews`)).data,
  create: async (id: string, rating: number, content: string) => (await api.post<Review>(`/books/${encodeURIComponent(id)}/reviews`, { rating, content })).data,
};
export const orderService = {
  create: async (items: CartItem[]) => (await api.post<{ id: string; total: number }>('/orders', { items: items.map(i => ({ bookId: i.book.id, quantity: i.quantity })) })).data,
};
