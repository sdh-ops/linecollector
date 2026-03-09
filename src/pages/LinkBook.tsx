import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Save, ChevronLeft, BookOpen, Loader2, X, Tag } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import styles from './LinkBook.module.css';

interface BookItem {
    title: string;
    author: string;
    cover: string;
    isbn13: string;
    categoryName?: string;
}


const HIGHLIGHT_COLORS = [
    { id: 'none', label: '기본', value: 'transparent' },
    { id: 'yellow', label: '노랑', value: 'rgba(254, 240, 138, 0.4)' },
    { id: 'green', label: '초록', value: 'rgba(187, 247, 208, 0.4)' },
    { id: 'blue', label: '파랑', value: 'rgba(191, 219, 254, 0.4)' },
    { id: 'pink', label: '분홍', value: 'rgba(251, 207, 232, 0.4)' },
];

export const LinkBook = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialText = location.state?.selectedText || '';
    const isbnQuery = location.state?.isbnQuery || '';

    const [textContent, setTextContent] = useState(initialText);
    const [searchQuery, setSearchQuery] = useState(isbnQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<BookItem[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [highlightColor, setHighlightColor] = useState('none');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [category, setCategory] = useState('기타');
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    useEffect(() => {
        if (isbnQuery) {
            handleSearch(isbnQuery);
        }
    }, [isbnQuery]);

    const handleSearch = async (queryOverride?: string) => {
        const query = queryOverride || searchQuery;
        if (!query.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        setSelectedBook(null);

        try {
            const response = await fetch(`https://oryxiptdxmuubszuhvvf.supabase.co/functions/v1/search-book?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.item && data.item.length > 0) {
                setSearchResults(data.item);
                if (queryOverride && data.item.length === 1) {
                    const book = data.item[0];
                    setSelectedBook(book);
                    // Auto-set category if found from book
                    if (book.categoryName) {
                        const cleanCategory = book.categoryName.split('>')[1] || book.categoryName.split('>')[0] || '기타';
                        setCategory(cleanCategory.trim());
                    }
                }
            }
        } catch (error) {
            console.error('Book search error:', error);
            alert('책 검색에 실패했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const analyzeSentence = async () => {
        if (!textContent.trim() || isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            const response = await fetch(`https://oryxiptdxmuubszuhvvf.supabase.co/functions/v1/analyze-sentence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: textContent })
            });
            const data = await response.json();

            if (data.tags && data.tags.length > 0) {
                // Merge tags, avoid duplicates
                setTags(prev => [...new Set([...prev, ...data.tags])]);
            }
            if (data.category && category === '기타') {
                setCategory(data.category);
            }
        } catch (error) {
            console.error('AI Analysis error:', error);
            // Fallback: No automatic tags if AI fails
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = async () => {
        if (!textContent.trim()) {
            alert('저장할 문장을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('sentences').insert([
                {
                    content: textContent,
                    book_title: selectedBook?.title || null,
                    book_author: selectedBook?.author || null,
                    book_cover_url: selectedBook?.cover || null,
                    isbn: selectedBook?.isbn13 || null,
                    user_id: user?.id,
                    highlight_color: highlightColor,
                    tags: tags,
                    is_public: isPublic,
                    category: category,
                }
            ]);


            if (error) throw error;

            navigate('/', { replace: true });
        } catch (error: any) {
            console.error('Insert error:', error);
            alert('저장에 실패했습니다: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className={styles.backBtn}>
                    <ChevronLeft size={24} />
                </Button>
                <h2 className={styles.title}>내용 확인 및 도서 연결</h2>
                <div style={{ width: 40 }} /> {/* Spacer */}
            </header>

            <div className={styles.contentArea}>
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>문장 내용</h3>
                        <span className={styles.editTip}>추출된 문장에 오타가 있다면 직접 수정해 보세요.</span>
                    </div>
                    <div className={styles.textAreaContainer}>
                        <textarea
                            className={`glass-panel ${styles.textArea}`}
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            onBlur={analyzeSentence}
                            rows={5}
                            placeholder="수집할 문장을 입력하거나 수정하세요."
                            style={{
                                backgroundColor: HIGHLIGHT_COLORS.find(c => c.id === highlightColor)?.value,
                                transition: 'background-color 0.3s ease'
                            }}
                        />
                        <button
                            className={styles.aiBtn}
                            onClick={analyzeSentence}
                            disabled={isAnalyzing}
                            type="button"
                        >
                            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                            AI 분석 (태그/카테고리 자동 생성)
                        </button>
                    </div>

                    <div className={styles.categoryBlock}>
                        <span className={styles.subLabel}>카테고리:</span>
                        <select
                            className={styles.categorySelect}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="기타">기타</option>
                            <option value="인문">인문</option>
                            <option value="사회">사회</option>
                            <option value="과학">과학</option>
                            <option value="문학">문학</option>
                            <option value="소설">소설</option>
                            <option value="에세이">에세이</option>
                            <option value="자기계발">자기계발</option>
                            <option value="경제경영">경제경영</option>
                            <option value="예술">예술</option>
                        </select>
                    </div>


                    <div className={styles.colorPickerBlock}>
                        <span className={styles.subLabel}>하이라이트 색상:</span>
                        <div className={styles.colorPalette}>
                            {HIGHLIGHT_COLORS.map(color => (
                                <button
                                    key={color.id}
                                    className={`${styles.colorBtn} ${highlightColor === color.id ? styles.colorBtnActive : ''}`}
                                    style={{ backgroundColor: color.value === 'transparent' ? 'var(--surface-color)' : color.value }}
                                    onClick={() => setHighlightColor(color.id)}
                                    title={color.label}
                                    type="button"
                                >
                                    {color.value === 'transparent' && <span className={styles.colorNoneLabel}>A</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.tagsBlock}>
                        <div className={styles.tagsInputWrapper}>
                            <Tag size={16} className={styles.tagIcon} />
                            <input
                                type="text"
                                placeholder="태그 입력 후 엔터 (예: 영감)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                className={styles.tagInput}
                            />
                        </div>
                        <div className={styles.tagsList}>
                            {tags.map((tag) => (
                                <span key={tag} className={styles.tagChip}>
                                    #{tag}
                                    <button onClick={() => handleRemoveTag(tag)} className={styles.tagRemoveBtn}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>도서 연결 (선택)</h3>
                    </div>

                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="책 제목이나 저자 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className={`glass-panel ${styles.searchInput}`}
                        />
                        <Button onClick={() => handleSearch()} disabled={isSearching} className={styles.searchBtn}>
                            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                        </Button>
                    </div>

                    <div className={styles.resultsArea}>
                        {selectedBook ? (
                            <div className={`${styles.bookCard} ${styles.selectedBook}`}>
                                <img src={selectedBook.cover} alt={selectedBook.title} className={styles.bookCover} />
                                <div className={styles.bookInfo}>
                                    <div className={styles.bookTitle}>{selectedBook.title}</div>
                                    <div className={styles.bookAuthor}>{selectedBook.author}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>
                                    변경
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.searchResults}>
                                {searchResults.map((book) => (
                                    <div
                                        key={book.isbn13}
                                        className={`glass-panel ${styles.bookCard}`}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            if (book.categoryName) {
                                                const cleanCategory = book.categoryName.split('>')[1] || book.categoryName.split('>')[0] || '기타';
                                                setCategory(cleanCategory.trim());
                                            }
                                        }}
                                    >
                                        {book.cover ? (
                                            <img src={book.cover} alt="" className={styles.bookCover} />
                                        ) : (
                                            <div className={styles.coverPlaceholder}><BookOpen size={24} /></div>
                                        )}
                                        <div className={styles.bookInfo}>
                                            <div className={styles.bookTitle}>{book.title}</div>
                                            <div className={styles.bookAuthor}>{book.author}</div>
                                        </div>
                                    </div>
                                ))}
                                {!isSearching && searchResults.length === 0 && searchQuery && (
                                    <p className={styles.noResults}>검색 결과가 없습니다.</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className={styles.actionArea}>
                <div className={styles.publicToggleSection}>
                    <div className={styles.publicInfo}>
                        <span className={styles.publicTitle}>함께 읽기 (공개)</span>
                        <span className={styles.publicDesc}>이 문장을 다른 사람들과 함께 읽고 싶으면 활성화하세요.</span>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
                <Button
                    fullWidth
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving || !textContent.trim()}
                >
                    {isSaving ? (
                        <><Loader2 size={20} className="animate-spin" /> 저장 중...</>
                    ) : (
                        <><Save size={20} /> 보관함에 저장하기</>
                    )}
                </Button>
            </div>
        </div>
    );
};
