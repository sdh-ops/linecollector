import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AppState {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    user: User | null;
    setUser: (user: User | null) => void;
    isAdmin: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    isAuthLoading: boolean;
    setIsAuthLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    theme: 'dark', // Default to emotional dark theme
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    user: null,
    setUser: (user) => set({ user }),
    isAdmin: false,
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    isAuthLoading: true,
    setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));
