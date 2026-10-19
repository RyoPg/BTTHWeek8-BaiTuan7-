import { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BookCard, Button, Loading, money, Page, styles } from '../../components/ui';
import BookReviews from '../../components/BookReviews';
import { bookService, errorMessage } from '../../services/api';
import { useCart } from '../../store/cart';
import type { Book } from '../../types';
import { useAuth } from '../../store/auth';
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookDetail key={id} id={id} />;
}
function BookDetail({ id }: { id: string }) {
  const cart = useCart(); const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null); const [related, setRelated] = useState<Book[]>([]); const [error, setError] = useState(''); const [relatedError, setRelatedError] = useState(''); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0); const [added, setAdded] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const current = await bookService.detail(id);
        if (!active) return; setBook(current);
        try { const all = await bookService.list(); if (active) setRelated(all.filter(b => b.id !== current.id && b.category === current.category)); }
        catch (e) { if (active) setRelatedError(errorMessage(e)); }
      } catch (e) { if (active) setError(errorMessage(e)); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [id, attempt]);
  if (loading) return <Page><Loading /></Page>;
  if (!book) return <Page><Text style={styles.error}>{error || 'Không tìm thấy sách.'}</Text><Button title="Thử lại" onPress={() => setAttempt(n => n + 1)} /><Button title="Về trang chủ" onPress={() => router.replace('/')} /></Page>;
  return <Page><View style={styles.card}><Image source={{ uri: book.cover }} style={[styles.cover, { width: 160, height: 220, alignSelf: 'center' }]} /><Text style={styles.muted}>{book.category} • {book.author}</Text><Text style={styles.title}>{book.title}</Text><Text style={styles.heading}>{money(book.price)}</Text><Text style={styles.text}>{book.description}</Text><Button title="Thêm vào giỏ hàng" onPress={() => { cart.add(book); setAdded(true); }} />{added && <Text style={styles.success}>Đã thêm sách vào giỏ.</Text>}<Button title="Xem giỏ hàng" onPress={() => router.push('/cart')} /></View>
    <BookReviews key={`${book.id}:${user?.id || 'guest'}`} bookId={book.id} />
    <Text style={styles.heading}>Sách liên quan</Text>{relatedError ? <><Text style={styles.error}>{relatedError}</Text><Button title="Thử lại" onPress={() => setAttempt(n => n + 1)} /></> : <FlatList horizontal data={related} keyExtractor={b => b.id} contentContainerStyle={{ gap: 12 }} renderItem={({ item }) => <BookCard book={item} onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })} />} ListEmptyComponent={<Text style={styles.muted}>Chưa có sách cùng danh mục.</Text>} />}
  </Page>;
}
