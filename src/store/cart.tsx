import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Book, CartItem } from '../types';
type Cart = { items: CartItem[]; add: (book: Book) => void; change: (id: string, delta: number) => void; clear: () => void };
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  function add(book: Book) { setItems(old => old.some(i => i.book.id === book.id) ? old.map(i => i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i) : [...old, { book, quantity: 1 }]); }
  function change(id: string, delta: number) { setItems(old => old.map(i => i.book.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0)); }
  return <Context.Provider value={{ items, add, change, clear: () => setItems([]) }}>{children}</Context.Provider>;
}
export function useCart() { const cart = useContext(Context); if (!cart) throw new Error('CartProvider missing'); return cart; }
