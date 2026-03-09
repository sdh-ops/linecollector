import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SentenceCard } from '../components/SentenceCard';
import type { SentenceData } from '../components/SentenceCard';
import { Compass, Loader2 } from 'lucide-react';
import styles from './Home.module.css'; // Reusing Home styles for consistency

export const Explore = () => {
    const [sentences, setSentences] = useState<SentenceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicSentences();
    }, []);

    const fetchPublicSentences = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch public sentences
            const { data, error } = await supabase
                .from('sentences')
                .select('*, likes(user_id)')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching public sentences:', error);
            } else {
                const fetched = (data as any[]).map(item => ({
                    ...item,
                    is_liked: item.likes?.some((l: any) => l.user_id === user?.id)
                }));
                setSentences(fetched);
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

    if (loading) {
        return (
            <div className={styles.centerContainer}>
                <Loader2 className="animate-spin" size={40} />
                <p>다른 사람들의 문장을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>둘러보기</h2>
                <p className={styles.subtitle}>다른 사람들에게 영감을 준 문장들을 만나보세요.</p>
            </header>

            {sentences.length === 0 ? (
                <div className={styles.emptyState}>
                    <Compass size={48} className={styles.emptyIcon} />
                    <h3>공개된 문장이 아직 없습니다</h3>
                    <p>당신의 문장을 가장 먼저 공유해보세요!</p>
                </div>
            ) : (
                <div className={styles.feed}>
                    {sentences.map((sentence) => (
                        <SentenceCard
                            key={sentence.id}
                            sentence={sentence}
                            onLike={handleLikeUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
