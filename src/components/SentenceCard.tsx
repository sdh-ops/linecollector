import { useState } from 'react';
import { BookOpen, Share2, Trash2, Heart, EyeOff, Star } from 'lucide-react';

import styles from './SentenceCard.module.css';
import { Button } from './Button';
import { ShareCardExporter } from './ShareCardExporter';
import { supabase } from '../lib/supabase';

export interface SentenceData {
    id: string;
    content: string;
    book_title: string | null;
    book_author: string | null;
    book_cover_url: string | null;
    isbn: string | null;
    created_at: string;
    tags: string[];
    highlight_color: string | null;
    is_public: boolean;
    likes_count: number;
    user_id: string;
    category: string;
    is_favorite: boolean;
    is_liked?: boolean;
}

interface SentenceCardProps {
    sentence: SentenceData;
    onDelete?: (id: string) => void;
    onHide?: (id: string) => void;
    onLike?: (id: string, isLiked: boolean) => void;
    onFavorite?: (id: string, isFavorite: boolean) => void;
    onBookClick?: (sentence: SentenceData) => void;
    currentUserId?: string;
}

const HIGHLIGHT_MAP: Record<string, string> = {
    yellow: 'rgba(254, 240, 138, 0.4)',
    green: 'rgba(187, 247, 208, 0.4)',
    blue: 'rgba(191, 219, 254, 0.4)',
    pink: 'rgba(251, 207, 232, 0.4)',
};

export const SentenceCard = ({ sentence, onDelete, onHide, onLike, onFavorite, onBookClick, currentUserId }: SentenceCardProps) => {
    const [showShare, setShowShare] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isOwner = currentUserId && sentence.user_id === currentUserId;

    const date = new Date(sentence.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const highlightStyle = sentence.highlight_color && HIGHLIGHT_MAP[sentence.highlight_color]
        ? { backgroundColor: HIGHLIGHT_MAP[sentence.highlight_color] }
        : {};

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLiking) return;
        setIsLiking(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (sentence.is_liked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('sentence_id', sentence.id);
                if (error) throw error;
                onLike?.(sentence.id, false);
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert([{ user_id: user.id, sentence_id: sentence.id }]);
                if (error) throw error;
                onLike?.(sentence.id, true);
            }
        } catch (error) {
            console.error('Like error:', error);
        } finally {
            setIsLiking(false);
        }
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFavoriting) return;
        setIsFavoriting(true);
        try {
            const newStatus = !sentence.is_favorite;
            const { error } = await supabase
                .from('sentences')
                .update({ is_favorite: newStatus })
                .eq('id', sentence.id);

            if (error) throw error;
            onFavorite?.(sentence.id, newStatus);
        } catch (error) {
            console.error('Favorite error:', error);
        } finally {
            setIsFavoriting(false);
        }
    };

    return (
        <article className={`glass-panel ${styles.card}`} onClick={() => showMenu && setShowMenu(false)}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.date}>{date}</span>
                    {sentence.is_public && <span className={styles.publicBadge}>공개</span>}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {/* Favorite */}
                    {isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFavoriteClick}
                            disabled={isFavoriting}
                            className={`${styles.favoriteBtn} ${sentence.is_favorite ? styles.favorited : ''}`}
                            aria-label="Favorite"
                        >
                            <Star size={18} fill={sentence.is_favorite ? "#D4A373" : "none"} stroke={sentence.is_favorite ? "#D4A373" : "currentColor"} />
                        </Button>
                    )}

                    {/* Like */}
                    <div className={styles.likeInfo}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLikeClick}
                            disabled={isLiking}
                            className={`${styles.likeBtn} ${sentence.is_liked ? styles.liked : ''}`}
                            aria-label="Like"
                        >
                            <Heart size={16} fill={sentence.is_liked ? "currentColor" : "none"} />
                        </Button>
                        {sentence.likes_count > 0 && <span className={styles.likeCount}>{sentence.likes_count}</span>}
                    </div>

                    {/* Share */}
                    <Button variant="ghost" size="icon" onClick={() => setShowShare(true)} aria-label="Share">
                        <Share2 size={16} />
                    </Button>

                    {/* Delete (only own sentences) */}
                    {(onDelete && isOwner !== false) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(sentence.id)}
                            aria-label="Delete"
                            className={styles.deleteBtn}
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}

                    {/* Hide from Explore (only own sentences in Explore) */}
                    {onHide && isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onHide(sentence.id)}
                            aria-label="Hide"
                            className={styles.hideBtn}
                        >
                            <EyeOff size={16} />
                        </Button>
                    )}
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

            {sentence.book_title && (
                <div
                    className={styles.bookInfo}
                    onClick={() => onBookClick?.(sentence)}
                    style={{ cursor: 'pointer' }}
                >
                    {sentence.book_cover_url ? (
                        <img src={sentence.book_cover_url} alt="" className={styles.cover} />
                    ) : (
                        <div className={`${styles.cover} ${styles.coverPlaceholder}`}>
                            <BookOpen size={20} />
                        </div>
                    )}
                    <div className={styles.bookMeta}>
                        <span className={styles.bookTitle}>{sentence.book_title}</span>
                        <span className={styles.bookAuthor}>{sentence.book_author}</span>
                    </div>
                </div>
            )}
        </article>
    );
};
