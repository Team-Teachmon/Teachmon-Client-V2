import { create } from 'zustand';
import { setAuthToken, clearAuthToken } from '@/lib/authToken';

interface AuthState {
  accessToken: string | null;
  isInitialized: boolean;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isInitialized: false,
  setAccessToken: (token) => {
    set({ accessToken: token });
    // axios 인스턴스의 기본 헤더 업데이트
    setAuthToken(token);
  },
  clearAuth: () => {
    set({ accessToken: null });
    // axios 인스턴스의 Authorization 헤더 제거
    clearAuthToken();
  },
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
