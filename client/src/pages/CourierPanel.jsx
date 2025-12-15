import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { 
  Phone, MapPin, Clock, CheckCircle, Package, 
  Truck, Search, CreditCard, Banknote, Smartphone
} from 'lucide-react'

const socket = io('http://localhost:3001')

const paymentLabels = {
  door_cash: { label: 'Nakit', icon: Banknote, color: 'text-green-600 bg-green-50' },
  door_card: { label: 'Kart (POS)', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
  online: { label: 'Online Ödendi', icon: Smartphone, color: 'text-purple-600 bg-purple-50' }
}

export default function CourierPanel() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    socket.on('orderUpdated', (updatedOrder) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder)
      }
    })

    return () => {
      socket.off('orderUpdated')
    }
  }, [order])

  const searchOrder = async () => {
    if (!orderId.trim()) {
      setError('Sipariş ID girin')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/${orderId.trim()}`)
      if (!res.ok) {
        throw new Error('Sipariş bulunamadı')
      }
      const data = await res.json()
      setOrder(data)
    } catch (err) {
      setError('Sipariş bulunamadı. ID\'yi kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const markAsDelivered = async () => {
    if (!order) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      })

      if (!res.ok) throw new Error('İşlem başarısız')

      const updatedOrder = await res.json()
      setOrder(updatedOrder)
      setSuccess('✅ Sipariş teslim edildi olarak işaretlendi!')
    } catch (err) {
      setError('Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      preparing: 'bg-blue-500',
      ready: 'bg-purple-500',
      out_for_delivery: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Beklemede',
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      out_for_delivery: 'Yolda',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal'
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🛵 Kurye Paneli
          </h1>
          <p className="text-orange-100 text-sm">Teslimat Takip Sistemi</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* Search Box */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sipariş ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder="Örn: A1B2C3D4"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase"
              maxLength={36}
            />
            <button
              onClick={searchOrder}
              disabled={loading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Search size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tezgahtan aldığınız 8 haneli sipariş kodunu girin
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Status */}
            <div className={`${getStatusColor(order.status)} px-4 py-3 text-white`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-2">
                  <Package size={20} />
                  {getStatusLabel(order.status)}
                </span>
                <span className="text-sm flex items-center gap-1">
                  <Clock size={14} />
                  {formatTime(order.createdAt)}
                </span>
              </div>
              <div className="mt-1 text-sm opacity-90">
                Sipariş: <span className="font-mono font-bold">#{order.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg mb-3">
                {order.firstName} {order.lastName}
              </h3>
              
              {/* Phone - Clickable */}
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-3 hover:bg-green-100 transition"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Phone size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-700">{order.phone}</p>
                  <p className="text-green-600 text-sm">Aramak için dokun</p>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">{order.address}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline"
                  >
                    Haritada göster
                  </a>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4 border-b">
              <h4 className="font-semibold text-gray-600 mb-2">SİPARİŞ İÇERİĞİ</h4>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{item.image}</span>
                      <span>{item.name}</span>
                      <span className="text-gray-400 font-bold">x{item.quantity}</span>
                    </span>
                  </div>
                ))}
              </div>
              {order.note && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm border border-yellow-200">
                  <span className="font-medium text-yellow-800">📝 Not:</span>
                  <span className="text-yellow-700 ml-1">{order.note}</span>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ödeme Yöntemi</p>
                  {(() => {
                    const payment = paymentLabels[order.paymentMethod] || paymentLabels.door_cash
                    const PaymentIcon = payment.icon
                    return (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-1 ${payment.color}`}>
                        <PaymentIcon size={16} />
                        <span className="font-semibold">{payment.label}</span>
                      </div>
                    )
                  })()}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-orange-600">₺{order.totalAmount}</p>
                </div>
              </div>
              
              {(order.paymentMethod === 'door_cash' || order.paymentMethod === 'door_card') && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-orange-700 font-medium text-center">
                    💰 Müşteriden ₺{order.totalAmount} tahsil edilecek
                  </p>
                </div>
              )}
              
              {order.paymentMethod === 'online' && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-700 font-medium text-center">
                    ✅ Ödeme online yapıldı - Tahsilat yok
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="p-4">
              {order.status === 'out_for_delivery' ? (
                <button
                  onClick={markAsDelivered}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={24} />
                      TESLİM EDİLDİ
                    </>
                  )}
                </button>
              ) : order.status === 'delivered' ? (
                <div className="text-center py-4">
                  <div className="text-6xl mb-2">✅</div>
                  <p className="text-green-600 font-bold text-lg">Bu sipariş teslim edildi</p>
                </div>
              ) : order.status === 'cancelled' ? (
                <div className="text-center py-4">
                  <div className="text-6xl mb-2">❌</div>
                  <p className="text-red-600 font-bold">Bu sipariş iptal edilmiş</p>
                </div>
              ) : (
                <div className="text-center py-4 bg-yellow-50 rounded-xl">
                  <Truck size={40} className="mx-auto text-yellow-600 mb-2" />
                  <p className="text-yellow-700 font-medium">
                    Bu sipariş henüz yola çıkmamış
                  </p>
                  <p className="text-yellow-600 text-sm">
                    Tezgahın "Yola Çıktı" demesini bekleyin
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!order && !error && (
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <Truck size={60} className="mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Teslimat Takibi</h3>
            <p className="text-gray-600 text-sm">
              Tezgahtan aldığınız sipariş ID'sini girerek teslimat detaylarını görüntüleyin ve teslim işlemini tamamlayın.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
