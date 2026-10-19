export function validateAuth(email: string, password: string, confirm?: string, name?: string) {
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Vui lòng nhập email hợp lệ.';
  if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (confirm !== undefined && confirm !== password) errors.confirm = 'Mật khẩu xác nhận chưa khớp.';
  if (name !== undefined && !name.trim()) errors.name = 'Vui lòng nhập họ tên.';
  return errors;
}
export function averageRating(reviews: { rating: number }[]) {
  const valid = reviews.filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
  return { count: valid.length, average: valid.length ? valid.reduce((sum, r) => sum + r.rating, 0) / valid.length : 0 };
}
