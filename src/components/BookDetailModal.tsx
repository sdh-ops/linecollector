import { X, BookOpen, User, Building, AlignLeft, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import styles from './BookDetailModal.module.css';
import { useEffect, useState } from 'react';

interface BookDetail {
    title: string;
    author: string;
    cover: string;
    publisher: string;
    description: string;
    isbn13: string;
    fullData?: any;
}

interface BookDetailModalProps {
    isbn: string | null;
    title: string | null;
    author: string | null;
    coverUrl: string | null;
    onClose: () => void;
}

export const BookDetailModal = ({ isbn, title, author, coverUrl, onClose }: BookDetailModalProps) => {
    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBookDetail = async () => {
            if (!isbn && !title) return;
            setLoading(true);
            try {
                const query = isbn || title || '';
                const response = await fetch(`https://oryxiptdxmuubszuhvvf.supabase.co/functions/v1/search-book?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.item && data.item.length > 0) {
                    // Try to find exact match by ISBN if available, otherwise take first
                    const found = isbn
                        ? data.item.find((item: any) => item.isbn13 === isbn) || data.item[0]
                        : data.item[0];

                    setBook({
                        title: found.title,
                        author: found.author,
                        cover: found.cover,
                        publisher: found.publisher,
                        description: found.description,
                        isbn13: found.isbn13,
                        fullData: found
                    });
                }
            } catch (error) {
                console.error('Error fetching book detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookDetail();
    }, [isbn, title]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.coverWrapper}>
                            {coverUrl || book?.cover ? (
                                <img src={coverUrl || book?.cover} alt={title || book?.title || ''} className={styles.cover} />
                            ) : (
                                <div className={styles.coverPlaceholder}>
                                    <BookOpen size={48} />
                                </div>
                            )}
                        </div>
                        <div className={styles.mainInfo}>
                            <h2 className={styles.title}>{title || book?.title || '정보 없음'}</h2>
                            <div className={styles.metaItem}>
                                <User size={16} />
                                <span>{author || book?.author || '저자 미상'}</span>
                            </div>
                            {book?.publisher && (
                                <div className={styles.metaItem}>
                                    <Building size={16} />
                                    <span>{book.publisher}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.details}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <AlignLeft size={18} />
                                도서 소개
                            </h3>
                            {loading ? (
                                <div className={styles.loading}>정보를 불러오는 중...</div>
                            ) : book?.description ? (
                                <p className={styles.description}>{book.description}</p>
                            ) : (
                                <p className={styles.noData}>도서 상세 설명이 없습니다.</p>
                            )}
                        </div>
                    </div>

                    {book?.fullData?.link && (
                        <div className={styles.actions}>
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => window.open(book.fullData.link, '_blank')}
                                className={styles.externalBtn}
                            >
                                <ExternalLink size={18} />
                                알라딘에서 자세히 보기
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
