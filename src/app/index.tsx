import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { BookCard, Button, Loading, Page, styles } from '../components/ui';
import { bookService, errorMessage } from '../services/api';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import type { Book } from '../types';
export default function HomeScreen() {
  const auth = useAuth(); const cart = useCart();
  const [books, setBooks] = useState<Book[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [loggingOut, setLoggingOut] = useState(false);
  async function load() { setLoading(true); setError(''); try { setBooks(await bookService.list()); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    bookService.list().then(result => { if (active) setBooks(result); }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function logout() { setLoggingOut(true); try { await auth.logout(); } finally { setLoggingOut(false); } }
  return <Page><Text style={styles.title}>{'Một cuốn sách,\nmột thế giới mới.'}</Text><Text style={styles.muted}>Cửa hàng sách minh họa • Bài thực hành Week 8</Text>
    {!!auth.notice && <Text style={styles.error}>{auth.notice}</Text>}
    <View style={styles.card}><Text style={styles.text}>{auth.user ? `Xin chào, ${auth.user.name}` : 'Chào bạn đến với Tiệm Sách'}</Text><View style={styles.row}>{auth.user ? <Button title={loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'} disabled={loggingOut} onPress={() => void logout()} /> : <Button title="Đăng nhập / Đăng ký" onPress={() => router.push('/login')} />}<Button title={`Giỏ hàng (${cart.items.reduce((n, i) => n + i.quantity, 0)})`} onPress={() => router.push('/cart')} /></View></View>
    <Text style={styles.heading}>Khám phá sách</Text>{loading ? <Loading /> : error ? <><Text style={styles.error}>{error}</Text><Button title="Thử lại" onPress={() => void load()} /></> : <View style={styles.row}>{books.map(book => <BookCard key={book.id} book={book} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} />)}{!books.length && <Text>Chưa có sách.</Text>}</View>}
  </Page>;
}
