import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { Button, money, Page, styles } from '../components/ui';
export default function CartScreen() {
  const cart = useCart(); const { user } = useAuth();
  return <Page><Text style={styles.title}>Giỏ sách của bạn</Text>{!cart.items.length ? <><Text style={styles.text}>Giỏ hàng đang trống.</Text><Button title="Khám phá sách" onPress={() => router.replace('/')} /></> : <>
    {cart.items.map(i => <View key={i.book.id} style={styles.card}><Text style={styles.heading}>{i.book.title}</Text><Text style={styles.text}>{money(i.book.price)} × {i.quantity}</Text><View style={styles.row}><Button title="−" onPress={() => cart.change(i.book.id, -1)} /><Text style={styles.text}>{i.quantity}</Text><Button title="+" disabled={i.quantity >= 999} onPress={() => cart.change(i.book.id, 1)} /></View></View>)}
    <Text style={styles.heading}>Tổng: {money(cart.items.reduce((n, i) => n + i.book.price * i.quantity, 0))}</Text><Button title="Thanh toán" onPress={() => user ? router.push('/checkout') : router.push({ pathname: '/login', params: { returnTo: 'checkout' } })} />
  </>}</Page>;
}
