import { useContext } from 'react'
import { AdminProvider, AdminContext } from '../contexts/AdminContext'
import AdminLogin from '../components/AdminLogin'
import AdminDashboard from './AdminDashboard'

function AdminContent() {
  const { isAuthenticated, loading } = useContext(AdminContext)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce">🌯</div>
          <p className="mt-4 text-white">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}

export default function AdminPanel() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  )
}
