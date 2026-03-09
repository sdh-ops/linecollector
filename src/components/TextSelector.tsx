import { useState, useEffect } from 'react';
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

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
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

    return (
        <div className={styles.container}>
            <div className={styles.instructionBox}>
                <p>간직하고 싶은 문장을 드래그하여 선택하세요.</p>
            </div>

            <div className={`glass-panel ${styles.textBoard}`}>
                <p className={styles.extractedText}>{text}</p>
            </div>

            <div className={styles.actionContainer}>
                {selectedText ? (
                    <Button fullWidth onClick={() => onSave(selectedText)} className={styles.saveBtn}>
                        <Save size={20} />
                        선택된 {selectedText.length}자 간직하기
                    </Button>
                ) : (
                    <Button fullWidth variant="secondary" onClick={onRetry}>
                        <RefreshCw size={20} />
                        다시 사진 선택하기
                    </Button>
                )}
            </div>
        </div>
    );
};
