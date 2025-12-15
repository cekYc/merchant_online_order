import { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Phone, MapPin, ArrowRight } from 'lucide-react'
import { CartContext } from '../App'

export default function Register() {
  const { customer, setCustomer } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo || '/'

  const [form, setForm] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    address: customer?.address || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!form.firstName || !form.lastName || !form.phone || !form.address) {
      setError('Lütfen tüm alanları doldurun')
      setLoading(false)
      return
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      setError('Geçerli bir telefon numarası girin (10-11 haneli)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/customers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        throw new Error('Kayıt başarısız')
      }

      const data = await res.json()
      setCustomer(data)
      navigate(redirectTo)
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={40} className="text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {customer ? 'Bilgilerinizi Güncelleyin' : 'Kayıt Olun'}
        </h2>
        <p className="text-gray-500 mt-1">Sipariş verebilmek için bilgilerinizi girin</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Adınız"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Soyadınız"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone size={16} className="inline mr-1" />
            Telefon Numarası
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="05XX XXX XX XX"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={16} className="inline mr-1" />
            Teslimat Adresi
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Mahalle, Sokak, Bina No, Daire No..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition transform active:scale-98"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {customer ? 'Güncelle' : 'Kayıt Ol'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
