import { useState, useEffect, useRef } from 'react';
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
    const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0, visible: false });
    const textBoardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();

            if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rects = range.getClientRects();
                if (rects.length === 0) return;

                // Use the last rect to position below the final line of selection
                const lastRect = rects[rects.length - 1];

                setSelectedText(selection.toString().trim());

                // Position 40px below the selection to clear system menus
                setToolbarPos({
                    top: lastRect.bottom + 40,
                    left: lastRect.left + lastRect.width / 2,
                    visible: true
                });
            } else {
                setToolbarPos(prev => ({ ...prev, visible: false }));
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

        // Haptic-like visual feedback: clear selection and hide toolbar
        window.getSelection()?.removeAllRanges();
        setSelectedText('');
        setToolbarPos(prev => ({ ...prev, visible: false }));
    };

    return (
        <div className={styles.container}>
            <div className={styles.instructionBox}>
                <p>간직하고 싶은 문장을 드래그해보세요. ✨</p>
            </div>

            <div className={styles.textBoard} ref={textBoardRef}>
                <p className={styles.extractedText}>{text}</p>
            </div>

            {toolbarPos.visible && selectedText && (
                <div
                    className={styles.floatingToolbar}
                    style={{
                        top: `${toolbarPos.top}px`,
                        left: `${toolbarPos.left}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <button className={styles.toolbarBtn} onClick={handleSave}>
                        <Save size={18} />
                        간직하기
                    </button>
                </div>
            )}

            <div className={styles.actionContainer}>
                <div className={styles.buttonGroup}>
                    <Button fullWidth onClick={onRetry} className={styles.completeBtn}>
                        <Check size={20} />
                        수집 완료 (보관함으로)
                    </Button>
                    <Button fullWidth variant="ghost" onClick={onRetry} className={styles.retryBtn}>
                        <Camera size={20} />
                        다시 찍기
                    </Button>
                </div>
            </div>
        </div>
    );
};
