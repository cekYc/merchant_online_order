import { useState, useContext } from 'react'
import { Lock, User, RefreshCw, AlertCircle } from 'lucide-react'
import { AdminContext } from '../contexts/AdminContext'

export default function AdminLogin() {
  const { login } = useContext(AdminContext)
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username || !form.password) {
      setError('Kullanıcı adı ve şifre gerekli')
      return
    }

    setLoading(true)
    try {
      await login(form.username, form.password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={40} className="text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Girişi</h1>
          <p className="text-gray-500 mt-1">Esnaf Dürüm Yönetim Paneli</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        {/* Default credentials hint */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-xs text-gray-400">
            Varsayılan giriş: <span className="font-mono text-gray-600">admin</span> / <span className="font-mono text-gray-600">admin123</span>
          </p>
          <p className="text-xs text-red-400 mt-1">
            ⚠️ İlk girişte şifrenizi değiştirin!
          </p>
        </div>
      </div>
    </div>
  )
}
