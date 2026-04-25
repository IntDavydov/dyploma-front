import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  balance: number;
  subscription: 'NONE' | 'GO' | 'PLUS' | 'PRO';
  messageCount?: number;
  chatsCreated?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  updateSubscription: (sub: User['subscription']) => void;
  incrementMessageCount: () => void;
  updateUsage: (messageCount: number, chatsCreated?: number) => void;
  deleteChat: () => void;
  resetUsage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user: { ...user, subscription: user.subscription || 'NONE', messageCount: user.messageCount || 0, chatsCreated: user.chatsCreated || 0 }, token }),
  setUser: (user) => set({ user: { ...user, subscription: user.subscription || 'NONE', messageCount: user.messageCount || 0, chatsCreated: user.chatsCreated || 0 } }),
  logout: () => set({ user: null, token: null }),
  updateBalance: (newBalance) => set((state) => ({ 
    user: state.user ? { ...state.user, balance: newBalance } : null 
  })),
  updateSubscription: (sub) => set((state) => ({
    user: state.user ? { ...state.user, subscription: sub } : null
  })),
  incrementMessageCount: () => set((state) => ({
    user: state.user ? { ...state.user, messageCount: (state.user.messageCount || 0) + 1 } : null
  })),
  updateUsage: (messageCount, chatsCreated) => set((state) => ({
    user: state.user ? { 
      ...state.user, 
      messageCount, 
      chatsCreated: chatsCreated !== undefined ? chatsCreated : state.user.chatsCreated 
    } : null
  })),
  deleteChat: () => set((state) => ({
    user: state.user ? { ...state.user, messageCount: 0, chatsCreated: (state.user.chatsCreated || 0) + 1 } : null
  })),
  resetUsage: () => set((state) => ({
    user: state.user ? { ...state.user, messageCount: 0, chatsCreated: 0 } : null
  })),
}));