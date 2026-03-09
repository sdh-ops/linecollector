import { useState, useEffect } from 'react';
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
        let isMounted = true;

        const extractText = async () => {
            try {
                if (isMounted) setProgress({ status: '이미지 분석 및 업로드 중...', progress: 0.3 });

                // Call Supabase Edge Function 'extract-text'
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oryxiptdxmuubszuhvvf.supabase.co';
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                const response = await fetch(`${supabaseUrl}/functions/v1/extract-text`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${anonKey}`
                    },
                    body: JSON.stringify({ imageBase64: imageSrc })
                });

                if (isMounted) setProgress({ status: 'AI가 문맥을 파악하며 텍스트를 완벽하게 교정 중입니다...', progress: 0.7 });

                if (!response.ok) {
                    throw new Error('AI 스캐너 서버와 연결할 수 없습니다.');
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                if (isMounted) {
                    setProgress({ status: '추출 완료!', progress: 1.0 });
                    onExtracted(data.text);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || '텍스트 추출 중 오류가 발생했습니다.');
                }
            }
        };

        extractText();

        return () => {
            isMounted = false;
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
                        <h3 className={styles.title}>AI 스캐너 작동 중...</h3>
                        <p className={styles.status}>{progress.status}</p>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.max(5, progress.progress * 100)}%`, transition: 'width 0.5s ease-in-out' }}
                            />
                        </div>
                        <div className={styles.ocrTips}>
                            <p>✨ Gemini AI가 책의 문맥을 이해하여 오타를 교정합니다.</p>
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
