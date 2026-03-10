import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';

export const Settings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setEmail(user.email || '');

            const { data, error } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setNickname(data.nickname || '');
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nickname.trim()) {
            alert('닉네임을 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    nickname: nickname.trim(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            navigate('/', { state: { message: '프로필이 업데이트되었습니다. ✨' } });
        } catch (error: any) {
            alert('저장 실패: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>불러오는 중...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>설정</h2>
            </header>

            <section style={{ backgroundColor: 'var(--surface-color)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--text-accent)' }}>
                        <User size={40} color="var(--text-accent)" style={{ margin: 'auto' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>이메일</label>
                    <input
                        type="text"
                        value={email}
                        disabled
                        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', opacity: 0.7 }}
                    />
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="나만의 닉네임을 설정하세요"
                        style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                    />
                </div>

                <Button fullWidth onClick={handleSave} disabled={saving}>
                    <Save size={18} style={{ marginRight: '8px' }} />
                    {saving ? '저장 중...' : '저장하기'}
                </Button>
            </section>

            <Button fullWidth variant="ghost" onClick={handleLogout} style={{ color: '#ef4444' }}>
                <LogOut size={18} style={{ marginRight: '8px' }} />
                로그아웃
            </Button>
        </div>
    );
};
