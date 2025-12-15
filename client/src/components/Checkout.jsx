import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Banknote, MapPin, Phone, User, FileText, Smartphone, Truck } from 'lucide-react'
import { CartContext } from '../App'

export default function Checkout() {
  const { cart, cartTotal, customer, clearCart } = useContext(CartContext)
  const navigate = useNavigate()
  
  const [paymentMethod, setPaymentMethod] = useState('door_cash')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!customer) {
    navigate('/register', { state: { redirectTo: '/checkout' } })
    return null
  }

  if (cart.length === 0) {
    navigate('/')
    return null
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          totalAmount: cartTotal,
          paymentMethod,
          note
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (errorData.error?.includes('Müşteri bulunamadı')) {
          // Clear customer from localStorage and redirect to register
          localStorage.removeItem('esnaf-customer')
          window.location.href = '/register'
          return
        }
        throw new Error(errorData.error || 'Sipariş gönderilemedi')
      }

      clearCart()
      navigate('/success')
    } catch (err) {
      setError(err.message || 'Sipariş gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in pb-6">
      {/* Customer Info */}
      <div className="bg-white p-4 border-b">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <User className="text-primary-500" size={20} />
          Teslimat Bilgileri
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="font-medium text-gray-800">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-gray-600 text-sm flex items-start gap-2">
            <Phone size={16} className="mt-0.5 flex-shrink-0" />
            {customer.phone}
          </p>
          <p className="text-gray-600 text-sm flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            {customer.address}
          </p>
        </div>
        <button
          onClick={() => navigate('/register', { state: { redirectTo: '/checkout' } })}
          className="text-primary-500 text-sm font-medium mt-2"
        >
          Bilgileri Düzenle
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-4 border-b">
        <h2 className="font-bold text-lg mb-3">📦 Sipariş Özeti</h2>
        <div className="space-y-2">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.image}</span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-sm">x{item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold">₺{item.price * item.quantity}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
          <span className="font-bold text-lg">Toplam</span>
          <span className="font-bold text-xl text-primary-600">₺{cartTotal}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white p-4 border-b">
        <h2 className="font-bold text-lg mb-3">💳 Ödeme Yöntemi</h2>
        <div className="space-y-3">
          {/* Kapıda Ödeme */}
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 flex items-center gap-2">
              <Truck size={18} className="text-gray-600" />
              <span className="font-semibold text-gray-700">Kapıda Ödeme</span>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => setPaymentMethod('door_cash')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition ${
                  paymentMethod === 'door_cash' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentMethod === 'door_cash' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Banknote size={20} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Nakit</p>
                  <p className="text-gray-500 text-xs">Kuryeye nakit ödeme</p>
                </div>
                {paymentMethod === 'door_cash' && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('door_card')}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition ${
                  paymentMethod === 'door_card' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  paymentMethod === 'door_card' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <CreditCard size={20} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Kredi/Banka Kartı</p>
                  <p className="text-gray-500 text-xs">Kuryenin POS cihazı ile ödeme</p>
                </div>
                {paymentMethod === 'door_card' && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Online Ödeme */}
          <button
            onClick={() => setPaymentMethod('online')}
            className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition ${
              paymentMethod === 'online' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              paymentMethod === 'online' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <Smartphone size={24} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold">Online Kart ile Ödeme</p>
              <p className="text-gray-500 text-sm">Güvenli online ödeme</p>
            </div>
            {paymentMethod === 'online' && (
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
          
          {paymentMethod === 'online' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              ℹ️ Online ödeme entegrasyonu yakında eklenecektir. Şimdilik kapıda ödeme seçeneklerini kullanabilirsiniz.
            </div>
          )}
        </div>
      </div>

      {/* Order Note */}
      <div className="bg-white p-4 border-b">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <FileText className="text-primary-500" size={20} />
          Sipariş Notu (Opsiyonel)
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ekstra sos, acılı olsun, kapıyı çalmayın vb..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="p-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition transform active:scale-98 shadow-lg"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              🌯 Siparişi Gönder
            </>
          )}
        </button>
        <p className="text-center text-gray-500 text-sm mt-3">
          Siparişiniz hemen hazırlanmaya başlanacak
        </p>
      </div>
    </div>
  )
}
