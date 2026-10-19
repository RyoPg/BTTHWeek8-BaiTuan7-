import { useRef, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { Button, Loading, money, Page, styles } from '../components/ui';
import { errorMessage, orderService } from '../services/api';
export default function CheckoutScreen() {
  const { user, isHydrating } = useAuth(); const cart = useCart(); const busy = useRef(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [order, setOrder] = useState('');
  if (isHydrating) return <Loading />;
  if (!user) return <Redirect href={{ pathname: '/login', params: { returnTo: 'checkout' } }} />;
  async function submit() {
    if (busy.current || !user || !cart.items.length) return;
    busy.current = true; setLoading(true); setError('');
    try { const created = await orderService.create(cart.items); cart.clear(); setOrder(created.id); }
    catch (e) { setError(errorMessage(e)); }
    finally { busy.current = false; setLoading(false); }
  }
  return <Page><Text style={styles.title}>Xác nhận đơn hàng</Text><Text style={styles.text}>Người đặt: {user.name} ({user.email})</Text><Text style={styles.muted}>Đặt hàng demo, không thu tiền thật.</Text>
    {order ? <><Text style={styles.success}>Đặt hàng thành công! Mã đơn: {order}</Text><Button title="Về trang chủ" onPress={() => router.replace('/')} /></> : cart.items.length ? <>{cart.items.map(i => <Text key={i.book.id} style={styles.text}>{i.book.title} × {i.quantity} — {money(i.book.price * i.quantity)}</Text>)}<Text style={styles.heading}>Tổng: {money(cart.items.reduce((n, i) => n + i.book.price * i.quantity, 0))}</Text><Button title={loading ? 'Đang đặt hàng…' : 'Xác nhận đặt hàng'} disabled={loading} onPress={() => void submit()} /></> : <><Text style={styles.text}>Giỏ hàng đang trống.</Text><Button title="Chọn sách" onPress={() => router.replace('/')} /></>}
    {!!error && <Text style={styles.error}>{error}</Text>}
  </Page>;
}
