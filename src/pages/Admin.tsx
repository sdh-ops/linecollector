import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileText, Heart, BookOpen, ShieldCheck,
    TrendingUp, Globe, Lock, Trash2, Plus, Loader2,
    BarChart3, Calendar
} from 'lucide-react';
import { Button } from '../components/Button';
import styles from './Admin.module.css';


interface AdminUser {
    id: string;
    email: string;
    added_by: string | null;
    created_at: string;
}

interface RecentSentence {
    id: string;
    content: string;
    created_at: string;
    is_public: boolean;
    likes_count: number;
    book_title: string | null;
}

export const Admin = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Metrics
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        totalSentences: 0,
        publicSentences: 0,
        totalLikes: 0,
        todaySentences: 0,
        weekSentences: 0,
    });

    const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; count: number }[]>([]);
    const [recentSentences, setRecentSentences] = useState<RecentSentence[]>([]);
    const [adminList, setAdminList] = useState<AdminUser[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'sentences' | 'admins'>('overview');

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) { navigate('/'); return; }
            setCurrentUserEmail(user.email);

            const { data: adminData } = await supabase
                .from('admins')
                .select('email')
                .eq('email', user.email)
                .single();

            if (!adminData) { navigate('/'); return; }
            setIsAuthorized(true);
            await loadAllData();
        } catch {
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const loadAllData = async () => {
        await Promise.all([
            loadMetrics(),
            loadCategoryBreakdown(),
            loadRecentSentences(),
            loadAdmins(),
        ]);
    };

    const loadMetrics = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [
            { count: totalSentences },
            { count: publicSentences },
            { count: todaySentences },
            { count: weekSentences },
            { data: likesData },
            { data: usersData },
        ] = await Promise.all([
            supabase.from('sentences').select('*', { count: 'exact', head: true }),
            supabase.from('sentences').select('*', { count: 'exact', head: true }).eq('is_public', true),
            supabase.from('sentences').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabase.from('sentences').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
            supabase.from('sentences').select('likes_count'),
            supabase.from('sentences').select('user_id'),
        ]);

        const totalLikes = (likesData || []).reduce((sum: number, s: any) => sum + (s.likes_count || 0), 0);
        const uniqueUsers = new Set((usersData || []).map((s: any) => s.user_id)).size;

        setMetrics({
            totalUsers: uniqueUsers,
            totalSentences: totalSentences || 0,
            publicSentences: publicSentences || 0,
            todaySentences: todaySentences || 0,
            weekSentences: weekSentences || 0,
            totalLikes,
        });
    };

    const loadCategoryBreakdown = async () => {
        const { data } = await supabase.from('sentences').select('category');
        if (!data) return;
        const map: Record<string, number> = {};
        data.forEach((s: any) => {
            const cat = s.category || '기타';
            map[cat] = (map[cat] || 0) + 1;
        });
        const sorted = Object.entries(map)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
        setCategoryBreakdown(sorted);
    };

    const loadRecentSentences = async () => {
        const { data } = await supabase
            .from('sentences')
            .select('id, content, created_at, is_public, likes_count, book_title')
            .order('created_at', { ascending: false })
            .limit(10);
        setRecentSentences((data || []) as RecentSentence[]);
    };

    const loadAdmins = async () => {
        const { data } = await supabase.from('admins').select('*').order('created_at');
        setAdminList((data || []) as AdminUser[]);
    };

    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) return;
        setAddingAdmin(true);
        try {
            const { error } = await supabase.from('admins').insert([{
                email: newAdminEmail.trim().toLowerCase(),
                added_by: currentUserEmail,
            }]);
            if (error) throw error;
            setNewAdminEmail('');
            await loadAdmins();
        } catch (error: any) {
            alert('추가 실패: ' + error.message);
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (id: string, email: string) => {
        if (email === currentUserEmail) { alert('자기 자신은 삭제할 수 없습니다.'); return; }
        if (!confirm(`${email} 을 운영자에서 제거하시겠습니까?`)) return;
        await supabase.from('admins').delete().eq('id', id);
        await loadAdmins();
    };

    if (loading || isAuthorized === null) {
        return (
            <div className={styles.loadingScreen}>
                <Loader2 className="animate-spin" size={32} />
                <p>권한 확인 중...</p>
            </div>
        );
    }

    const maxCatCount = Math.max(...categoryBreakdown.map(c => c.count), 1);

    return (
        <div className={styles.page}>
            {/* Admin Header */}
            <header className={styles.adminHeader}>
                <div className={styles.headerLeft}>
                    <ShieldCheck size={22} className={styles.shieldIcon} />
                    <div>
                        <h1 className={styles.adminTitle}>운영자 대시보드</h1>
                        <p className={styles.adminSub}>{currentUserEmail}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                    ← 앱으로
                </Button>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                {(['overview', 'sentences', 'admins'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' && '📊 개요'}
                        {tab === 'sentences' && '📝 최근 문장'}
                        {tab === 'admins' && '🔐 운영자 관리'}
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                    <>
                        {/* KPI Cards */}
                        <div className={styles.kpiGrid}>
                            <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                                <div className={styles.kpiIcon}><Users size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.totalUsers}</div>
                                <div className={styles.kpiLabel}>활성 사용자</div>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiGold}`}>
                                <div className={styles.kpiIcon}><FileText size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.totalSentences}</div>
                                <div className={styles.kpiLabel}>전체 문장</div>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                                <div className={styles.kpiIcon}><Globe size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.publicSentences}</div>
                                <div className={styles.kpiLabel}>공개 문장</div>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiRose}`}>
                                <div className={styles.kpiIcon}><Heart size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.totalLikes}</div>
                                <div className={styles.kpiLabel}>총 좋아요</div>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                                <div className={styles.kpiIcon}><Calendar size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.todaySentences}</div>
                                <div className={styles.kpiLabel}>오늘 수집량</div>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiTeal}`}>
                                <div className={styles.kpiIcon}><TrendingUp size={22} /></div>
                                <div className={styles.kpiValue}>{metrics.weekSentences}</div>
                                <div className={styles.kpiLabel}>이번 주 문장</div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}><BarChart3 size={16} /> 카테고리별 문장 수</h3>
                            <div className={styles.barChart}>
                                {categoryBreakdown.map(item => (
                                    <div key={item.category} className={styles.barRow}>
                                        <span className={styles.barLabel}>{item.category}</span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.barFill}
                                                style={{ width: `${(item.count / maxCatCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.barValue}>{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Stats */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>📈 비율 지표</h3>
                            <div className={styles.statsList}>
                                <div className={styles.statRow}>
                                    <span>공개율</span>
                                    <span className={styles.statValue}>
                                        {metrics.totalSentences > 0
                                            ? Math.round((metrics.publicSentences / metrics.totalSentences) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className={styles.statRow}>
                                    <span>평균 좋아요 / 문장</span>
                                    <span className={styles.statValue}>
                                        {metrics.publicSentences > 0
                                            ? (metrics.totalLikes / metrics.publicSentences).toFixed(1)
                                            : '0'}
                                    </span>
                                </div>
                                <div className={styles.statRow}>
                                    <span>사용자당 평균 문장</span>
                                    <span className={styles.statValue}>
                                        {metrics.totalUsers > 0
                                            ? (metrics.totalSentences / metrics.totalUsers).toFixed(1)
                                            : '0'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* ── SENTENCES TAB ── */}
                {activeTab === 'sentences' && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>최근 수집 문장 (10건)</h3>
                        <div className={styles.sentenceList}>
                            {recentSentences.map(s => (
                                <div key={s.id} className={styles.sentenceRow}>
                                    <div className={styles.sentenceMeta}>
                                        <span className={styles.sentenceDate}>
                                            {new Date(s.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                        {s.is_public
                                            ? <span className={`${styles.badge} ${styles.badgeGreen}`}><Globe size={10} /> 공개</span>
                                            : <span className={`${styles.badge} ${styles.badgeGray}`}><Lock size={10} /> 비공개</span>
                                        }
                                        {s.likes_count > 0 && (
                                            <span className={`${styles.badge} ${styles.badgeRose}`}>
                                                <Heart size={10} /> {s.likes_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className={styles.sentenceContent}>{s.content.slice(0, 80)}{s.content.length > 80 ? '...' : ''}</p>
                                    {s.book_title && (
                                        <p className={styles.sentenceBook}><BookOpen size={11} /> {s.book_title}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── ADMINS TAB ── */}
                {activeTab === 'admins' && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}><ShieldCheck size={16} /> 운영자 계정 관리</h3>

                        {/* Add Admin */}
                        <div className={styles.addAdminRow}>
                            <input
                                type="email"
                                className={styles.adminEmailInput}
                                placeholder="추가할 운영자 이메일"
                                value={newAdminEmail}
                                onChange={e => setNewAdminEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddAdmin()}
                            />
                            <Button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail.trim()} size="sm">
                                {addingAdmin ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                추가
                            </Button>
                        </div>

                        {/* Admin List */}
                        <div className={styles.adminList}>
                            {adminList.map(admin => (
                                <div key={admin.id} className={styles.adminRow}>
                                    <div className={styles.adminInfo}>
                                        <ShieldCheck size={16} className={styles.adminRowIcon} />
                                        <div>
                                            <p className={styles.adminEmail}>{admin.email}
                                                {admin.email === currentUserEmail && <span className={styles.meBadge}> (나)</span>}
                                            </p>
                                            <p className={styles.adminMeta}>
                                                {admin.added_by ? `${admin.added_by}이 추가` : '시스템 설정'} ·{' '}
                                                {new Date(admin.created_at).toLocaleDateString('ko-KR')}
                                            </p>
                                        </div>
                                    </div>
                                    {admin.email !== currentUserEmail && (
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
