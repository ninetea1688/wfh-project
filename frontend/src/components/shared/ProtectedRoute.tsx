import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  children: React.ReactNode
  role?: 'ADMIN' | 'STAFF' | 'ANY'
}

export default function ProtectedRoute({ children, role = 'ANY' }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'ANY' && user?.role !== role) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
