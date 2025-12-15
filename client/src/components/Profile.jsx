import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, Save, RefreshCw } from 'lucide-react'
import { CartContext } from '../App'

export default function Profile() {
  const { customer, setCustomer } = useContext(CartContext)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    address: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Eğer giriş yapmamışsa login'e yönlendir
  useEffect(() => {
    if (!customer) {
      navigate('/login')
    } else {
      setForm({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        address: customer.address || ''
      })
    }
  }, [customer, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.firstName || !form.lastName || !form.address) {
      setError('Lütfen tüm alanları doldurun')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: customer.phone
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Güncelleme başarısız')
      }

      setCustomer(data)
      setSuccess('Bilgileriniz güncellendi!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!customer) return null

  return (
    <div className="p-4 fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={40} className="text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Profil Bilgileri</h2>
        <p className="text-gray-500 mt-1">Bilgilerinizi güncelleyin</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm mb-4">
          ✓ {success}
        </div>
      )}

      {/* Phone (readonly) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Phone size={16} className="inline mr-1" />
          Telefon Numarası
        </label>
        <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
          {customer.phone}
        </div>
        <p className="text-xs text-gray-400 mt-1">Telefon numarası değiştirilemez</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Adınız"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Soyadınız"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={16} className="inline mr-1" />
            Teslimat Adresi
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Mahalle, Sokak, Bina No, Daire No..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
        >
          {loading ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Kaydet
            </>
          )}
        </button>
      </form>
    </div>
  )
}
