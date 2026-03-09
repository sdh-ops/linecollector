import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, ZapOff } from 'lucide-react';
import { Button } from './Button';
import styles from './BarcodeScanner.module.css';

interface BarcodeScannerProps {
    onScan: (isbn: string) => void;
    onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode('qr-reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8],
            verbose: false
        });
        scannerRef.current = scanner;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
        };

        scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
                onScan(decodedText);
                stopScanner();
            },
            undefined
        ).catch(err => {
            console.error('Scanner start error:', err);
        });

        return () => {
            stopScanner();
        };
    }, [onScan]);

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error('Scanner stop error:', err);
            }
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.header}>
                <h3>바코드 스캔</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X size={24} />
                </Button>
            </div>

            <div className={styles.scannerContainer}>
                <div id="qr-reader" className={styles.reader}></div>
                <div className={styles.guideBox}>
                    <div className={styles.cornerThin}></div>
                </div>
                <p className={styles.helpText}>책 뒷면의 ISBN 바코드를 사각틀 안에 맞춰주세요.</p>
            </div>
        </div>
    );
};
