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

const BG_OPTIONS = [
    { id: 'dark', label: '다크', bg: '#1a1918', text: '#e6e0d8' },
    { id: 'cream', label: '크림', bg: '#f7f0e6', text: '#2d2b28' },
    { id: 'slate', label: '슬레이트', bg: '#1e293b', text: '#e2e8f0' },
    { id: 'rose', label: '로즈', bg: '#fff1f2', text: '#881337' },
    { id: 'forest', label: '포레스트', bg: '#14532d', text: '#dcfce7' },
    { id: 'lavender', label: '라벤더', bg: '#f5f3ff', text: '#4c1d95' },
];

export const ShareCardExporter = ({ sentence, onClose }: ShareCardExporterProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedBg, setSelectedBg] = useState(BG_OPTIONS[0]);
    const [fontSize, setFontSize] = useState(18); // px

    const captureCanvas = async () => {
        if (!cardRef.current) return null;
        return await html2canvas(cardRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: null,
        });
    };

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            const canvas = await captureCanvas();
            if (!canvas) return;
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
        setIsExporting(true);
        try {
            const canvas = await captureCanvas();
            if (!canvas) return;
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'sentence.png', { type: 'image/png' });
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: '문장집', text: '마음에 드는 문장을 공유합니다.' });
                } else {
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

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.controlRow}>
                        <span className={styles.controlLabel}>배경</span>
                        <div className={styles.bgOptions}>
                            {BG_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`${styles.bgSwatch} ${selectedBg.id === opt.id ? styles.bgSwatchActive : ''}`}
                                    style={{ background: opt.bg, border: `2px solid ${selectedBg.id === opt.id ? opt.text : 'transparent'}` }}
                                    onClick={() => setSelectedBg(opt)}
                                    title={opt.label}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={styles.controlRow}>
                        <span className={styles.controlLabel}>글자 크기 {fontSize}px</span>
                        <input
                            type="range"
                            min={13}
                            max={28}
                            step={1}
                            value={fontSize}
                            onChange={e => setFontSize(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                </div>

                <div className={styles.previewArea}>
                    <div
                        ref={cardRef}
                        className={styles.exportCard}
                        style={{ background: selectedBg.bg, color: selectedBg.text }}
                    >
                        <div className={styles.decorator} style={{ background: selectedBg.text, opacity: 0.15 }} />
                        <div className={styles.cardHeader}>
                            <span className={styles.brand} style={{ color: selectedBg.text, opacity: 0.5 }}>문장집</span>
                        </div>
                        <div className={styles.cardContent}>
                            <p className={styles.sentenceText} style={{ fontSize: `${fontSize}px`, color: selectedBg.text }}>
                                {sentence.content}
                            </p>
                        </div>
                        <div className={styles.cardFooter}>
                            {sentence.book_title && (
                                <div className={styles.bookInfo}>
                                    <span className={styles.bookTitle} style={{ color: selectedBg.text }}>{sentence.book_title}</span>
                                    <span className={styles.bookAuthor} style={{ color: selectedBg.text, opacity: 0.6 }}>{sentence.book_author}</span>
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
