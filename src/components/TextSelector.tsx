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
    const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // Set popup position above the selection
                setPopupPos({
                    top: rect.top,
                    left: rect.left + rect.width / 2
                });
                setSelectedText(selection.toString().trim());
            } else {
                setSelectedText('');
                setPopupPos(null);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.instructionBox}>
                <p>간직하고 싶은 문장만 드래그하여 저장해두세요. ✨</p>
            </div>

            <div className={`glass-panel ${styles.textBoard}`}>
                <p className={styles.extractedText}>{text}</p>
            </div>

            {popupPos && selectedText && (
                <div
                    className={styles.floatingToolbar}
                    style={{ top: `${popupPos.top}px`, left: `${popupPos.left}px` }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
                >
                    <button className={styles.popupSaveBtn} onClick={() => onSave(selectedText)}>
                        <Save size={16} />
                        저장하기
                    </button>
                </div>
            )}

            <div className={styles.actionContainer}>
                {!selectedText && (
                    <Button fullWidth variant="secondary" onClick={onRetry}>
                        <RefreshCw size={20} />
                        다시 사진 선택하기
                    </Button>
                )}
                {selectedText && (
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px' }}>
                        문장 위 '저장하기' 버튼을 눌러주세요.
                    </p>
                )}
            </div>
        </div>
    );
};
