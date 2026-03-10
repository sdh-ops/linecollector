import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, ScanText, Barcode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { OCRProcessor } from '../components/OCRProcessor';
import { TextSelector } from '../components/TextSelector';
import { BarcodeScanner } from '../components/BarcodeScanner';
import styles from './Capture.module.css';

type CaptureState = 'PICK_IMAGE' | 'EXTRACTING' | 'SELECTING';

export const Capture = () => {
    const navigate = useNavigate();
    const [appState, setAppState] = useState<CaptureState>('PICK_IMAGE');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [showScanner, setShowScanner] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBarcodeScan = async (isbn: string) => {
        setShowScanner(false);
        // We can optionally navigate directly to Search result or just pre-fill something.
        // For now, let's navigate to Search with the isbn as query
        navigate(`/link-book`, { state: { selectedText: '', isbnQuery: isbn } });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result as string);
                setAppState('PICK_IMAGE'); // Reset state
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = (capture: 'environment' | false) => {
        if (fileInputRef.current) {
            if (capture) {
                fileInputRef.current.setAttribute('capture', 'environment');
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.click();
        }
    };

    const clearImage = () => {
        setImageSrc(null);
        setExtractedText('');
        setAppState('PICK_IMAGE');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startExtraction = () => {
        setAppState('EXTRACTING');
    };

    const handleExtractionComplete = (text: string) => {
        setExtractedText(text);
        setAppState('SELECTING');
    };

    const [toast, setToast] = useState<string | null>(null);

    const handleSaveText = async (text: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const { error } = await supabase
                .from('sentences')
                .insert([{
                    content: text,
                    user_id: user.id,
                    is_public: false,
                    category: '기타'
                }]);

            if (error) throw error;

            // Show success toast and STAY on the screen for multi-scrap
            setToast('문장 저장됨 ✓');
            setTimeout(() => setToast(null), 2000);
        } catch (error: any) {
            alert('저장 실패: ' + error.message);
        }
    };

    const handleComplete = () => {
        navigate('/');
    };

    if (appState === 'SELECTING') {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h2 className={styles.title}>문장 가다듬기</h2>
                    <p className={styles.subtitle}>간직할 문장만 드래그해주세요.</p>
                </header>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TextSelector text={extractedText} onSave={handleSaveText} onRetry={handleComplete} />
                </div>
                {toast && (
                    <div className={styles.toast}>
                        {toast}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>문장 스캔</h2>
                <p className={styles.subtitle}>책에서 간직하고 싶은 부분을 촬영하세요.</p>
            </header>

            <div className={styles.previewContainer}>
                {appState === 'EXTRACTING' && imageSrc && (
                    <OCRProcessor
                        imageSrc={imageSrc}
                        onExtracted={handleExtractionComplete}
                        onCancel={() => setAppState('PICK_IMAGE')}
                    />
                )}

                {imageSrc ? (
                    <img src={imageSrc} alt="Captured page" className={styles.previewImage} />
                ) : (
                    <div className={styles.placeholder}>
                        <ScanText size={48} className={styles.placeholderIcon} />
                        <p>사진을 찍거나 앨범에서 선택해주세요</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <div className={styles.actionGroup}>
                {!imageSrc ? (
                    <>
                        <Button
                            className={styles.actionButton}
                            onClick={() => triggerFileInput('environment')}
                        >
                            <Camera size={20} />
                            카메라로 촬영
                        </Button>
                        <Button
                            variant="secondary"
                            className={styles.actionButton}
                            onClick={() => setShowScanner(true)}
                        >
                            <Barcode size={20} />
                            바코드 스캔
                        </Button>
                        <Button
                            variant="ghost"
                            className={styles.actionButton}
                            onClick={() => triggerFileInput(false)}
                        >
                            <ImageIcon size={20} />
                            앨범에서 선택
                        </Button>
                    </>
                ) : (
                    <>
                        <Button fullWidth onClick={startExtraction} disabled={appState === 'EXTRACTING'}>
                            <ScanText size={20} />
                            텍스트 읽어오기
                        </Button>
                        <Button fullWidth variant="ghost" onClick={clearImage} disabled={appState === 'EXTRACTING'}>
                            다시 선택하기
                        </Button>
                    </>
                )}
            </div>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleBarcodeScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};
