import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Camera, Search as SearchIcon, Moon, Sun, LogOut, WifiOff, Compass } from 'lucide-react';
import { useAppStore } from './store';
import { supabase } from './lib/supabase';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Capture } from './pages/Capture';
import { LinkBook } from './pages/LinkBook';
import { Search } from './pages/Search';
import { AuthPage } from './pages/AuthPage';
import { Button } from './components/Button';

function App() {
  const { theme, toggleTheme, user, setUser, isAuthLoading, setIsAuthLoading } = useAppStore();
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsAuthLoading]);

  // Hide bottom nav on specific screens
  const hideBottomNav = location.pathname === '/link-book';

  if (isAuthLoading) {
    return (
      <div className={`app-container ${theme}-theme`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin"><SearchIcon size={24} /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`app-container ${theme}-theme`}>
        <AuthPage />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={`app-container ${theme}-theme`}>
      {isOffline && (
        <div className="offline-banner">
          <WifiOff size={16} />
          <span>오프라인 모드입니다. 일부 기능이 제한될 수 있습니다.</span>
        </div>
      )}
      {!hideBottomNav && (
        <header className="app-header">
          <h1>문장서랍</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </header>
      )}

      <main className="app-main" style={{ paddingBottom: hideBottomNav ? 0 : '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Explore />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/search" element={<Search />} />
          <Route path="/link-book" element={<LinkBook />} />
        </Routes>
      </main>

      {!hideBottomNav && (
        <nav className="bottom-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <HomeIcon size={24} />
            <span>보관함</span>
          </Link>
          <Link to="/discover" className={location.pathname === '/discover' ? 'active' : ''}>
            <Compass size={24} />
            <span>둘러보기</span>
          </Link>
          <Link to="/capture" className={location.pathname === '/capture' ? 'active' : ''}>
            <Camera size={24} />
            <span>스캔</span>
          </Link>
          <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>
            <SearchIcon size={24} />
            <span>검색</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default App;
