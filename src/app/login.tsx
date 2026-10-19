import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Button, Field, Page, styles } from '../components/ui';
import { useAuth } from '../store/auth';
import { errorMessage } from '../services/api';
import { validateAuth } from '../utils/validation';
export default function LoginScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const auth = useAuth(); const busy = useRef(false);
  const [register, setRegister] = useState(false); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  function edit(key: string, setter: (s: string) => void, value: string) { setter(value); setErrors(old => ({ ...old, [key]: '', ...(key === 'password' ? { confirm: '' } : {}) })); setError(''); }
  async function submit() {
    if (busy.current) return;
    const validation = validateAuth(email, password, register ? confirm : undefined, register ? name : undefined);
    setErrors(validation); if (Object.keys(validation).length) return;
    busy.current = true; setLoading(true); setError('');
    try {
      if (register) await auth.register(name.trim(), email.trim().toLowerCase(), password); else await auth.login(email.trim().toLowerCase(), password);
      router.replace(returnTo === 'checkout' ? '/checkout' : '/');
    } catch (e) { setError(errorMessage(e)); }
    finally { busy.current = false; setLoading(false); }
  }
  return <Page><Text style={styles.title}>{register ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</Text><Text style={styles.muted}>{returnTo === 'checkout' ? 'Đăng nhập để tiếp tục thanh toán. Giỏ hàng được giữ nguyên.' : 'Đăng nhập để mua sách và chia sẻ đánh giá.'}</Text>
    {register && <Field label="Họ tên" value={name} error={errors.name} editable={!loading} onChangeText={s => edit('name', setName, s)} maxLength={100} />}
    <Field label="Email" value={email} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} onChangeText={s => edit('email', setEmail, s)} />
    <Field label="Mật khẩu" value={password} error={errors.password} secureTextEntry autoCapitalize="none" editable={!loading} onChangeText={s => edit('password', setPassword, s)} maxLength={200} />
    {register && <Field label="Xác nhận mật khẩu" value={confirm} error={errors.confirm} secureTextEntry editable={!loading} onChangeText={s => edit('confirm', setConfirm, s)} maxLength={200} />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button title={loading ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'} disabled={loading} onPress={() => void submit()} />
    <Button title={register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'} disabled={loading} onPress={() => { setRegister(!register); setErrors({}); setError(''); setPassword(''); setConfirm(''); }} />
  </Page>;
}
