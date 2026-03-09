import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SentenceCard } from '../components/SentenceCard';
import type { SentenceData } from '../components/SentenceCard';
import { BookOpen } from 'lucide-react';
import styles from './Home.module.css';

export const Home = () => {
    const [sentences, setSentences] = useState<SentenceData[]>([]);
    const [dailySentence, setDailySentence] = useState<SentenceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSentences();
    }, []);

    const fetchSentences = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

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
        } catch (error: any) {
            console.error('Delete error:', error);
            alert('삭제에 실패했습니다: ' + error.message);
        }
    };

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
            <header className={styles.header}>
                <h2 className={styles.title}>내 보관함</h2>
                <p className={styles.subtitle}>{sentences.length}개의 문장이 수집되었습니다.</p>
            </header>

            {dailySentence && (
                <section className={styles.dailySection}>
                    <div className={`${styles.dailyCard}`}>
                        <span className={styles.dailyBadge}>오늘의 문장</span>
                        <p className={styles.dailyContent}>"{dailySentence.content}"</p>
                        <div className={styles.dailyMeta}>
                            {dailySentence.book_title && <span>— {dailySentence.book_title}</span>}
                        </div>
                    </div>
                </section>
            )}

            {sentences.length === 0 ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} className={styles.emptyIcon} />
                    <h3>저장된 문장이 없습니다</h3>
                    <p>아래 스캔 버튼을 눌러 첫 문장을 수집해보세요.</p>
                </div>
            ) : (
                <div className={styles.feed}>
                    {sentences.map((sentence) => (
                        <SentenceCard
                            key={sentence.id}
                            sentence={sentence}
                            onDelete={handleDelete}
                            onLike={handleLikeUpdate}
                            onMenuClick={(id) => console.log('menu clicked', id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
