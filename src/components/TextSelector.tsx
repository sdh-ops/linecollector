import { useState, useEffect } from 'react';
import { Save, Check, Camera } from 'lucide-react';
import { Button } from './Button';
import styles from './TextSelector.module.css';

interface TextSelectorProps {
    text: string;
    onSave: (selectedText: string) => void;
    onRetry: () => void;
}

export const TextSelector = ({ text, onSave, onRetry }: TextSelectorProps) => {
    const [selectedText, setSelectedText] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim() || '';

            if (text.length > 0) {
                setSelectedText(text);
                setIsSelectionMode(true);
            } else {
                setIsSelectionMode(false);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    const handleSave = () => {
        if (!selectedText) return;
        onSave(selectedText);
        window.getSelection()?.removeAllRanges();
        setSelectedText('');
        setIsSelectionMode(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.instructionBox}>
                <p>간직하고 싶은 문장을 드래그해보세요. ✨</p>
            </div>

            <div className={styles.textBoard}>
                <p className={styles.extractedText}>{text}</p>
            </div>

            <div className={styles.actionContainer}>
                <div className={`${styles.buttonGroup} ${isSelectionMode ? styles.selectionActive : ''}`}>
                    {/* Mode 1: Selection Mode (Save) */}
                    <div className={styles.selectionModeLayer}>
                        <Button
                            fullWidth
                            onClick={handleSave}
                            className={styles.saveBtn}
                        >
                            <Save size={18} />
                            이 문장 간직하기
                        </Button>
                    </div>

                    {/* Mode 2: Normal Mode (Complete / Retry) */}
                    <div className={styles.normalModeLayer}>
                        <div className={styles.dualButtons}>
                            <Button fullWidth onClick={onRetry} className={styles.completeBtn}>
                                <Check size={18} />
                                수집 완료
                            </Button>
                            <Button fullWidth variant="ghost" onClick={onRetry} className={styles.retryBtn}>
                                <Camera size={18} />
                                다시 찍기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
