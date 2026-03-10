import { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import styles from './TextSelector.module.css';

interface TextSelectorProps {
    text: string;
    onSave: (selectedText: string) => void;
    onRetry: () => void;
}

export const TextSelector = ({ text, onSave, onRetry }: TextSelectorProps) => {
    const [selectedText, setSelectedText] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
                setSelectedText(selection.toString().trim());
            } else {
                setSelectedText('');
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    const handleSave = () => {
        onSave(selectedText);
        // Clear selection after save to allow next one
        window.getSelection()?.removeAllRanges();
        setSelectedText('');
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.instructionBox}>
                <p>간직하고 싶은 문장만 드래그하여 저장해두세요. ✨</p>
            </div>

            <div className={`glass-panel ${styles.textBoard}`}>
                <p className={styles.extractedText}>{text}</p>
            </div>

            {selectedText && (
                <div className={styles.selectionBar}>
                    <div className={styles.selectionInfo}>
                        <span className={styles.selectionLabel}>선택된 문장</span>
                        <p className={styles.selectionPreview}>{selectedText}</p>
                    </div>
                    <button className={styles.saveButton} onClick={handleSave}>
                        <Save size={18} />
                        저장하기
                    </button>
                </div>
            )}

            <div className={styles.actionContainer}>
                {!selectedText && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <Button fullWidth onClick={onRetry}>
                            <RefreshCw size={18} />
                            수집 완료하기 (홈으로)
                        </Button>
                        <Button fullWidth variant="ghost" onClick={onRetry}>
                            다른 사진 찍기
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
