import { useState } from 'react';
import { MoreVertical, BookOpen, Share2 } from 'lucide-react';
import styles from './SentenceCard.module.css';
import { Button } from './Button';
import { ShareCardExporter } from './ShareCardExporter';

export interface SentenceData {
    id: string;
    content: string;
    book_title: string | null;
    book_author: string | null;
    book_cover_url: string | null;
    created_at: string;
    tags: string[];
    highlight_color: string | null;
}

interface SentenceCardProps {
    sentence: SentenceData;
    onMenuClick?: (id: string) => void;
}

const HIGHLIGHT_MAP: Record<string, string> = {
    yellow: 'rgba(254, 240, 138, 0.4)',
    green: 'rgba(187, 247, 208, 0.4)',
    blue: 'rgba(191, 219, 254, 0.4)',
    pink: 'rgba(251, 207, 232, 0.4)',
};

export const SentenceCard = ({ sentence, onMenuClick }: SentenceCardProps) => {
    const [showShare, setShowShare] = useState(false);
    const date = new Date(sentence.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const highlightStyle = sentence.highlight_color && HIGHLIGHT_MAP[sentence.highlight_color]
        ? { backgroundColor: HIGHLIGHT_MAP[sentence.highlight_color] }
        : {};

    return (
        <article className={`glass-panel ${styles.card}`}>
            <div className={styles.header}>
                <span className={styles.date}>{date}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowShare(true)}
                        aria-label="Share"
                    >
                        <Share2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMenuClick?.(sentence.id)}
                        aria-label="More options"
                    >
                        <MoreVertical size={16} />
                    </Button>
                </div>
            </div>

            {showShare && (
                <ShareCardExporter
                    sentence={sentence}
                    onClose={() => setShowShare(false)}
                />
            )}

            <div className={styles.contentWrapper} style={highlightStyle}>
                <p className={`sentence-text ${styles.content}`}>
                    {sentence.content}
                </p>
            </div>

            {sentence.tags && sentence.tags.length > 0 && (
                <div className={styles.tagsArea}>
                    {sentence.tags.map(tag => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                </div>
            )}

            {(sentence.book_title || sentence.book_author) && (
                <div className={styles.bookInfo}>
                    {sentence.book_cover_url ? (
                        <img
                            src={sentence.book_cover_url}
                            alt={sentence.book_title || 'Book cover'}
                            className={styles.cover}
                        />
                    ) : (
                        <div className={`${styles.cover} ${styles.coverPlaceholder}`}>
                            <BookOpen size={20} />
                        </div>
                    )}
                    <div className={styles.bookMeta}>
                        <span className={styles.bookTitle}>{sentence.book_title || '제목 없음'}</span>
                        <span className={styles.bookAuthor}>{sentence.book_author || '저자 미상'}</span>
                    </div>
                </div>
            )}
        </article>
    );
};
