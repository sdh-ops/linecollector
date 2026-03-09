import { useState, useEffect } from 'react';
import { Search as SearchIcon, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SentenceCard } from '../components/SentenceCard';
import type { SentenceData } from '../components/SentenceCard';
import styles from './Search.module.css';

export const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SentenceData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-search after typing delay (debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                performSearch();
            } else {
                setResults([]);
                setHasSearched(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
        setHasSearched(true);

        try {
            const { data, error } = await supabase
                .from('sentences')
                .select('*')
                .or(`content.ilike.%${query}%,book_title.ilike.%${query}%,book_author.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResults(data as SentenceData[]);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>검색</h2>
                <p className={styles.subtitle}>간직한 문장이나 책을 찾아보세요.</p>
            </header>

            <div className={styles.searchBar}>
                <SearchIcon size={20} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="단어, 책 제목, 저자 입력..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.searchInput}
                    autoFocus
                />
                {isSearching && <Loader2 size={20} className={`animate-spin ${styles.spinner}`} />}
            </div>

            <div className={styles.resultsArea}>
                {!hasSearched ? (
                    <div className={styles.emptyState}>
                        <SearchIcon size={48} className={styles.emptyIcon} />
                        <p>어떤 문장을 찾고 계신가요?</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className={styles.feed}>
                        {results.map((sentence) => (
                            <SentenceCard key={sentence.id} sentence={sentence} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} className={styles.emptyIcon} />
                        <p>'{query}'에 대한 검색 결과가 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
