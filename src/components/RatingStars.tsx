import { Pressable, Text, View } from 'react-native';
export default function RatingStars({ value = 0, size = 22, onChange, readonly = !onChange }: { value?: number; size?: number; onChange?: (rating: number) => void; readonly?: boolean }) {
  const rating = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  return <View accessibilityLabel={`${rating.toFixed(1)} trên 5 sao`} style={{ flexDirection: 'row' }}>{[1, 2, 3, 4, 5].map(star => <Pressable key={star} accessibilityRole={readonly ? 'text' : 'button'} accessibilityLabel={`${star} sao`} accessibilityState={{ selected: star === rating }} disabled={readonly} onPress={() => onChange?.(star)} style={{ minWidth: readonly ? size : 44, minHeight: readonly ? size : 44, justifyContent: 'center' }}><Text style={{ fontSize: size, color: '#b77d15' }}>{rating >= star ? '★' : rating >= star - 0.5 ? '◐' : '☆'}</Text></Pressable>)}</View>;
}
