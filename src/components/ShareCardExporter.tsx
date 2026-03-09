import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Loader2, X } from 'lucide-react';
import { Button } from './Button';
import type { SentenceData } from './SentenceCard';
import styles from './ShareCardExporter.module.css';

interface ShareCardExporterProps {
    sentence: SentenceData;
    onClose: () => void;
}

export const ShareCardExporter = ({ sentence, onClose }: ShareCardExporterProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `sentence-${sentence.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            alert('이미지 생성에 실패했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'sentence.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: '문장서랍',
                        text: '마음에 드는 문장을 공유합니다.',
                    });
                } else {
                    // Fallback to download
                    handleDownload();
                }
            });
        } catch (error) {
            console.error('Share error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>이미지로 공유하기</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                <div className={styles.previewArea}>
                    <div ref={cardRef} className={styles.exportCard}>
                        <div className={styles.decorator}></div>
                        <div className={styles.cardHeader}>
                            <span className={styles.brand}>문장서랍</span>
                        </div>
                        <div className={styles.cardContent}>
                            <p className={styles.sentenceText}>
                                {sentence.content}
                            </p>
                        </div>
                        <div className={styles.cardFooter}>
                            {sentence.book_title && (
                                <div className={styles.bookInfo}>
                                    <span className={styles.bookTitle}>{sentence.book_title}</span>
                                    <span className={styles.bookAuthor}>{sentence.book_author}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={handleDownload} disabled={isExporting} fullWidth>
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                        이미지 저장
                    </Button>
                    <Button onClick={handleShare} disabled={isExporting} fullWidth>
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                        인스타그램 / 공유
                    </Button>
                </div>
            </div>
        </div>
    );
};
