import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../store/auth';
import { errorMessage, reviewService } from '../services/api';
import { averageRating } from '../utils/validation';
import type { Review } from '../types';
import RatingStars from './RatingStars';
import { Button, Field, Loading, styles } from './ui';
export default function BookReviews({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const [rating, setRating] = useState(0); const [content, setContent] = useState(''); const [ratingError, setRatingError] = useState(''); const [contentError, setContentError] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [sending, setSending] = useState(false);
  const busy = useRef(false); const alive = useRef(true);
  const { average, count } = averageRating(reviews);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function load() {
    setLoading(true); setLoadError('');
    try { const result = await reviewService.list(bookId); if (alive.current) setReviews(result); }
    catch (e) { if (alive.current) setLoadError(errorMessage(e)); }
    finally { if (alive.current) setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    reviewService.list(bookId).then(result => { if (active) setReviews(result); }).catch(e => { if (active) setLoadError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId]);
  async function submit() {
    if (busy.current) return;
    if (!user) { setError('Vui lòng đăng nhập trước khi đánh giá.'); return; }
    setRatingError(rating < 1 || rating > 5 ? 'Vui lòng chọn từ 1 đến 5 sao.' : '');
    setContentError(!content.trim() ? 'Vui lòng nhập bình luận.' : '');
    if (rating < 1 || rating > 5 || !content.trim()) return;
    busy.current = true; setSending(true); setError(''); setSuccess('');
    try {
      const created = await reviewService.create(bookId, rating, content.trim());
      if (!alive.current) return;
      setReviews(old => [...old.filter(r => r.id !== created.id), created]);
      setRating(0); setContent(''); setSuccess('Đã gửi đánh giá thành công.');
    } catch (e) { if (alive.current) setError(errorMessage(e)); }
    finally { busy.current = false; if (alive.current) setSending(false); }
  }
  return <View style={styles.card}><Text style={styles.heading}>Đánh giá từ bạn đọc</Text>
    {loading ? <Loading /> : loadError ? <><Text style={styles.error}>{loadError}</Text><Button title="Tải lại đánh giá" onPress={() => void load()} /></> : <>
      <RatingStars value={average} size={26} /><Text style={styles.text}>{count ? `${average.toFixed(1)} / 5 • ${count} đánh giá` : 'Chưa có đánh giá'}</Text>
      {reviews.map(review => <View key={review.id} style={{ borderTopWidth: 1, borderColor: '#e4e8e0', paddingTop: 12, gap: 6 }}><Text style={styles.heading}>{review.user.name}</Text><RatingStars value={review.rating} size={20} /><Text style={styles.text}>{review.content}</Text></View>)}
    </>}
    {!user ? <><Text style={styles.muted}>Đăng nhập để chia sẻ cảm nhận về cuốn sách.</Text><Button title="Đăng nhập để đánh giá" onPress={() => router.push('/login')} /></> : <>
      <Text style={styles.heading}>Viết đánh giá của bạn</Text><RatingStars value={rating} size={30} onChange={sending ? undefined : value => { setRating(value); setRatingError(''); setSuccess(''); }} />
      {!!ratingError && <Text style={styles.error}>{ratingError}</Text>}<Field label="Bình luận" multiline maxLength={2000} value={content} error={contentError} editable={!sending} onChangeText={value => { setContent(value); setContentError(''); setError(''); setSuccess(''); }} />
      <Button title={sending ? 'Đang gửi…' : 'Gửi đánh giá'} disabled={sending || loading || !!loadError} onPress={() => void submit()} />
    </>}
    {!!error && <Text style={styles.error}>{error}</Text>}{!!success && <Text accessibilityRole="alert" style={styles.success}>{success}</Text>}
  </View>;
}
