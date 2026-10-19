import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { authService, onUnauthorized, setToken } from '../services/api';
import type { AuthResponse, User } from '../types';

const KEY = 'bookstore.auth.v1';
type Auth = { user: User | null; isHydrating: boolean; notice: string; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<Auth | null>(null);
function validSession(value: unknown): value is AuthResponse {
  const s = value as AuthResponse | null;
  return !!s && typeof s.token === 'string' && !!s.token && typeof s.user?.id === 'string' && typeof s.user?.name === 'string' && typeof s.user?.email === 'string';
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setHydrating] = useState(true);
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const writes = useRef(Promise.resolve());
  const persist = useCallback((value: string | null) => {
    const operation = writes.current.catch(() => {}).then(() => value ? AsyncStorage.setItem(KEY, value) : AsyncStorage.removeItem(KEY));
    writes.current = operation;
    return operation;
  }, []);
  const clear = useCallback(async (message = '') => {
    generation.current++;
    setToken(null); setUser(null); setNotice(message);
    try { await persist(null); } catch { setNotice('Không xóa được phiên trên thiết bị. Hãy thử đăng xuất lại.'); }
  }, [persist]);
  useEffect(() => {
    let active = true;
    onUnauthorized(() => { void clear('Phiên hết hạn. Vui lòng đăng nhập lại.'); });
    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        const session: unknown = JSON.parse(raw);
        if (!validSession(session)) throw new Error('Phiên không hợp lệ');
        setToken(session.token);
        const verifiedUser = await authService.me();
        if (active) { setUser(verifiedUser); await persist(JSON.stringify({ token: session.token, user: verifiedUser })); }
      } catch { if (active) await clear('Không thể khôi phục phiên. Vui lòng đăng nhập lại.'); }
      finally { if (active) setHydrating(false); }
    }
    void restoreSession();
    return () => { active = false; onUnauthorized(); };
  }, [clear, persist]);
  async function authenticate(request: () => Promise<AuthResponse>) {
    const version = ++generation.current;
    const session = await request();
    if (version !== generation.current) throw new Error('Phiên đã thay đổi. Vui lòng thử lại.');
    if (!validSession(session)) throw new Error('Phản hồi đăng nhập không hợp lệ.');
    await persist(JSON.stringify(session));
    if (version !== generation.current) return;
    setToken(session.token); setUser(session.user); setNotice('');
  }
  async function logout() {
    try { await authService.logout(); } catch { /* Local session must still be cleared offline. */ }
    await clear();
  }
  return <AuthContext.Provider value={{ user, isHydrating, notice, login: (e, p) => authenticate(() => authService.login(e, p)), register: (n, e, p) => authenticate(() => authService.register(n, e, p)), logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const auth = useContext(AuthContext); if (!auth) throw new Error('AuthProvider missing'); return auth; }
