import { create } from 'zustand'

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
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token, user) => set({ token, user, isAuthenticated: true }),

  logout: () => set({ token: null, user: null, isAuthenticated: false }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
}))
