import { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Loader2 } from 'lucide-react';
import { Button } from './Button';
import styles from './OCRProcessor.module.css';

interface OCRProcessorProps {
    imageSrc: string;
    onExtracted: (text: string) => void;
    onCancel: () => void;
}

export const OCRProcessor = ({ imageSrc, onExtracted, onCancel }: OCRProcessorProps) => {
    const [progress, setProgress] = useState<{ status: string; progress: number }>({ status: '초기화 중...', progress: 0 });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let worker: Tesseract.Worker | null = null;
        let isMounted = true;

        const extractText = async () => {
            try {
                worker = await Tesseract.createWorker('kor', 1, {
                    logger: (m) => {
                        if (isMounted) {
                            setProgress({ status: m.status, progress: m.progress });
                        }
                    }
                });

                const { data: { text } } = await worker.recognize(imageSrc);

                if (isMounted) {
                    onExtracted(text);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || '텍스트 추출 중 오류가 발생했습니다.');
                }
            } finally {
                if (worker) {
                    await worker.terminate();
                }
            }
        };

        extractText();

        return () => {
            isMounted = false;
            if (worker) {
                worker.terminate();
            }
        };
    }, [imageSrc, onExtracted]);

    return (
        <div className={styles.container}>
            <div className={styles.progressBox}>
                {error ? (
                    <>
                        <p className={styles.error}>{error}</p>
                        <Button onClick={onCancel} variant="secondary">돌아가기</Button>
                    </>
                ) : (
                    <>
                        <Loader2 className={styles.spinner} size={48} />
                        <h3 className={styles.title}>문장을 읽고 있습니다...</h3>
                        <p className={styles.status}>{progress.status}</p>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.max(5, progress.progress * 100)}%` }}
                            />
                        </div>
                        <div className={styles.ocrTips}>
                            <p>💡 팁: 조명이 밝고 글자가 수평일 때 더 잘 읽혀요.</p>
                        </div>
                        <Button onClick={onCancel} variant="ghost" className={styles.cancelBtn}>
                            취소하기
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
