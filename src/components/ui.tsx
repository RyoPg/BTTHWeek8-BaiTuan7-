import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import type { Book } from '../types';
export const money = (value: number) => value.toLocaleString('vi-VN') + ' ₫';
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f4ef' },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#173c35' },
  heading: { fontSize: 20, fontWeight: '700', color: '#173c35' },
  text: { fontSize: 16, lineHeight: 24, color: '#354a45' },
  muted: { fontSize: 14, color: '#64746c', lineHeight: 21 },
  card: { padding: 18, gap: 12, borderRadius: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  button: { backgroundColor: '#216653', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#b9c8bf', borderRadius: 10, backgroundColor: 'white', padding: 13, fontSize: 16, color: '#173c35' },
  error: { color: '#af2e30', fontSize: 14, lineHeight: 21 },
  success: { color: '#216653', fontSize: 15 },
  cover: { width: 100, height: 140, borderRadius: 8, backgroundColor: '#dedbd2' },
});
export function Page({ children }: { children: ReactNode }) { return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>; }
export function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.5 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>; }
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) { return <View style={{ gap: 6 }}><Text style={styles.text}>{label}</Text><TextInput accessibilityLabel={label} {...props} style={[styles.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }]} />{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</View>; }
export function Loading() { return <View style={{ padding: 32 }}><ActivityIndicator size="large" color="#216653" /><Text style={[styles.muted, { textAlign: 'center' }]}>Đang tải…</Text></View>; }
export function BookCard({ book, onPress }: { book: Book; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`Xem ${book.title}`} onPress={onPress} style={[styles.card, { width: 190 }]}><Image source={{ uri: book.cover }} style={styles.cover} /><Text style={styles.heading}>{book.title}</Text><Text style={styles.muted}>{book.category}</Text><Text style={styles.text}>{money(book.price)}</Text></Pressable>; }
