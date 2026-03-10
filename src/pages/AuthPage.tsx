import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import styles from './AuthPage.module.css';

export const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setErrorMsg('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                else alert('회원가입이 완료되었습니다. (이메일 인증이 필요할 수 있습니다)');
            }
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logoArea}>
                    <BookOpen size={48} className={styles.logoIcon} />
                    <h1 className={styles.title}>문장집</h1>
                    <p className={styles.subtitle}>나만의 문장을 프라이빗하게 간직하세요</p>
                </div>

                <form onSubmit={handleAuth} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hello@example.com"
                            className="glass-panel"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="자신만의 비밀번호"
                            className="glass-panel"
                            required
                            minLength={6}
                        />
                    </div>

                    {errorMsg && <div className={styles.error}>{errorMsg}</div>}

                    <Button type="submit" fullWidth size="lg" disabled={isLoading} className={styles.submitBtn}>
                        {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? '로그인' : '회원가입')}
                    </Button>
                </form>

                <div className={styles.toggleArea}>
                    <span className={styles.toggleText}>
                        {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                    </span>
                    <button
                        type="button"
                        className={styles.toggleBtn}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? '회원가입' : '로그인'}
                    </button>
                </div>
            </div>
        </div>
    );
};
