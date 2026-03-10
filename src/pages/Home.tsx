import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SentenceCard } from '../components/SentenceCard';
import type { SentenceData } from '../components/SentenceCard';
import { BookText } from 'lucide-react';
import { BookDetailModal } from '../components/BookDetailModal';
import styles from './Home.module.css';

export const Home = () => {
    const location = useLocation();
    const [sentences, setSentences] = useState<SentenceData[]>([]);
    const [dailySentence, setDailySentence] = useState<SentenceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBookForDetail, setSelectedBookForDetail] = useState<SentenceData | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('전체');
    const [currentUserId, setCurrentUserId] = useState<string | undefined>();
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const categories = ['전체', ...Array.from(new Set(sentences.map(s => s.category || '기타')))];

    // Stats
    const totalCount = sentences.length;
    const todayCount = sentences.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length;

    useEffect(() => {
        fetchSentences();

        // Handle incoming message from navigation
        const state = location.state as { message?: string };
        if (state?.message) {
            setToastMessage(state.message);
            setTimeout(() => setToastMessage(null), 3000);
            // Clear location state
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchSentences = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id);

            const { data, error } = await supabase
                .from('sentences')
                .select('*, likes(user_id)')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching sentences:', error);
            } else {
                const fetchedSentences = (data as any[]).map(item => ({
                    ...item,
                    is_liked: item.likes?.some((l: any) => l.user_id === user?.id)
                })) as SentenceData[];

                setSentences(fetchedSentences);

                if (fetchedSentences.length > 0) {
                    const today = new Date().toDateString();
                    let seed = 0;
                    for (let i = 0; i < today.length; i++) {
                        seed += today.charCodeAt(i);
                    }
                    const index = seed % fetchedSentences.length;
                    setDailySentence(fetchedSentences[index]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLikeUpdate = (id: string, isLiked: boolean) => {
        setSentences(prev => prev.map(s => {
            if (s.id === id) {
                return {
                    ...s,
                    is_liked: isLiked,
                    likes_count: isLiked ? s.likes_count + 1 : Math.max(0, s.likes_count - 1)
                };
            }
            return s;
        }));
    };

    const handleFavoriteUpdate = (id: string, isFavorite: boolean) => {
        setSentences(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, is_favorite: isFavorite };
            }
            return s;
        }));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 문장을 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('sentences')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSentences(prev => prev.filter(s => s.id !== id));
            if (dailySentence?.id === id) {
                setDailySentence(null);
            }
            setToastMessage('문장이 삭제되었습니다.');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error: any) {
            console.error('Delete error:', error);
            alert('삭제에 실패했습니다: ' + error.message);
        }
    };

    const filteredSentences = selectedCategory === '전체'
        ? sentences
        : sentences.filter(s => (s.category || '기타') === selectedCategory);

    if (loading) {
        return (
            <div className={styles.centerContainer}>
                <div className={styles.spinner}></div>
                <p>문장을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {toastMessage && (
                <div className={styles.toast}>
                    {toastMessage}
                </div>
            )}

            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h2 className={styles.title}>문장집</h2>
                    <div className={styles.statsBadge}>
                        <span>오늘 <b>{todayCount}</b></span>
                        <span className={styles.divider}>|</span>
                        <span>전체 <b>{totalCount}</b></span>
                    </div>
                </div>
                <p className={styles.subtitle}>나만의 소중한 문장들을 모아두는 곳</p>
            </header>

            {dailySentence && (
                <section className={styles.dailySection}>
                    <div className={`${styles.dailyCard}`}>
                        <span className={styles.dailyBadge}>오늘의 문장</span>
                        <p className={styles.dailyContent}>"{dailySentence.content}"</p>
                        <div className={styles.dailyMeta}>
                            {dailySentence.book_title && <span onClick={() => setSelectedBookForDetail(dailySentence)} style={{ cursor: 'pointer' }}>— {dailySentence.book_title}</span>}
                        </div>
                    </div>
                </section>
            )}

            <section className={styles.filterSection}>
                <div className={styles.categoryList}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.categoryTab} ${selectedCategory === cat ? styles.activeTab : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {filteredSentences.length === 0 ? (
                <div className={styles.introContainer}>
                    <div className={styles.introContent}>
                        <div className={styles.introIconBox}>
                            <BookText size={48} />
                        </div>
                        <h3>문장집</h3>
                        <p className={styles.introText}>
                            책에서 발견한 좋은 문장을 찍고<br />
                            나만의 문장집에 담아두세요.
                        </p>
                        <p className={styles.introSubText}>
                            나중에 검색으로 언제든<br />
                            찾아볼 수 있습니다.
                        </p>
                        <div className={styles.introGuide}>
                            <p>✨ 아래 <b>스캔</b> 버튼을 눌러 첫 문장을 수집해보세요.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.feed}>
                    {filteredSentences.map((sentence) => (
                        <SentenceCard
                            key={sentence.id}
                            sentence={sentence}
                            onDelete={handleDelete}
                            onLike={handleLikeUpdate}
                            onFavorite={handleFavoriteUpdate}
                            onBookClick={(s) => setSelectedBookForDetail(s)}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}

            {selectedBookForDetail && (
                <BookDetailModal
                    isbn={selectedBookForDetail.isbn}
                    title={selectedBookForDetail.book_title}
                    author={selectedBookForDetail.book_author}
                    coverUrl={selectedBookForDetail.book_cover_url}
                    onClose={() => setSelectedBookForDetail(null)}
                />
            )}
        </div>
    );
};
