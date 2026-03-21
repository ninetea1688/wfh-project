import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  username: string
  role: 'ADMIN' | 'STAFF'
  position?: string | null
  phone?: string | null
  department?: { id: number; name: string } | null
}

interface AuthState {
  user: User | null
  token: string | null
  tokenExpiresAt: number | null   // unix ms
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          tokenExpiresAt: Date.now() + 8 * 60 * 60 * 1000,  // 8 hours
        }),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false, tokenExpiresAt: null }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'wfh-auth',
      onRehydrateStorage: () => (state) => {
        // Auto-logout if token is expired after rehydration
        if (state && state.tokenExpiresAt && Date.now() > state.tokenExpiresAt) {
          state.logout()
        }
      },
    },
  ),
)
