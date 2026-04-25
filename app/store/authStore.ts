import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  updateBalance: (newBalance) => set((state) => ({ 
    user: state.user ? { ...state.user, balance: newBalance } : null 
  })),
}));