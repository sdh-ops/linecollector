import styles from './AdBanner.module.css';
import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';

export const AdBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className={`glass-panel ${styles.adContainer}`}>
            <button className={styles.closeBtn} onClick={() => setIsVisible(false)}>
                <X size={14} />
            </button>
            <div className={styles.adBadge}>AD</div>
            <div className={styles.content}>
                <div className={styles.textGroup}>
                    <p className={styles.adTitle}>지금 이 문장의 원문을 만나보세요</p>
                    <p className={styles.adDesc}>알라딘에서 '오늘의 특가' 도서를 확인하세요.</p>
                </div>
                <button
                    className={styles.actionBtn}
                    onClick={() => window.open('https://www.aladin.co.kr', '_blank')}
                >
                    <ExternalLink size={14} />
                    보러가기
                </button>
            </div>
        </div>
    );
};
