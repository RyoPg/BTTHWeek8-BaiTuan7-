import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../store/auth';
import { CartProvider } from '../store/cart';
import { Loading } from '../components/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
function Navigation() {
  const { isHydrating } = useAuth();
  if (isHydrating) return <Loading />;
  return <Stack screenOptions={{ headerTintColor: '#173c35', headerStyle: { backgroundColor: '#f6f4ef' }, contentStyle: { backgroundColor: '#f6f4ef' } }}><Stack.Screen name="index" options={{ title: 'Tiệm Sách • Week 8' }} /><Stack.Screen name="login" options={{ title: 'Tài khoản' }} /><Stack.Screen name="book/[id]" options={{ title: 'Chi tiết sách' }} /><Stack.Screen name="cart" options={{ title: 'Giỏ hàng' }} /><Stack.Screen name="checkout" options={{ title: 'Thanh toán' }} /></Stack>;
}
export default function Layout() { return <SafeAreaProvider><AuthProvider><CartProvider><Navigation /></CartProvider></AuthProvider></SafeAreaProvider>; }
