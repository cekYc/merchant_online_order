import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { 
  Package, Clock, MapPin, Phone, XCircle, 
  ChefHat, Truck, CheckCircle, Bell, ArrowLeft
} from 'lucide-react'
import { CartContext } from '../App'

const socket = io('http://localhost:3001')

const statusConfig = {
  pending: { 
    label: 'Sipariş Alındı', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-600',
    icon: Bell,
    canCancel: true
  },
  preparing: { 
    label: 'Hazırlanıyor', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
    icon: ChefHat,
    canCancel: true
  },
  ready: { 
    label: 'Hazır - Kurye Bekleniyor', 
    color: 'bg-purple-500', 
    textColor: 'text-purple-600',
    icon: Package,
    canCancel: true
  },
  out_for_delivery: { 
    label: 'Yolda', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    icon: Truck,
    canCancel: false
  },
  delivered: { 
    label: 'Teslim Edildi', 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    icon: CheckCircle,
    canCancel: false
  },
  cancelled: { 
    label: 'İptal Edildi', 
    color: 'bg-red-500', 
    textColor: 'text-red-600',
    icon: XCircle,
    canCancel: false
  }
}

export default function MyOrders() {
  const { customer } = useContext(CartContext)
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (!customer) {
      navigate('/register', { state: { redirectTo: '/orders' } })
      return
    }

    fetchOrders()

    socket.on('orderUpdated', (updatedOrder) => {
      if (updatedOrder.customerId === customer.id) {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
      }
    })

    return () => {
      socket.off('orderUpdated')
    }
  }, [customer])

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/customers/${customer.id}/orders`)
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (orderId) => {
    if (!confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return

    setCancellingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id })
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'İptal işlemi başarısız')
        return
      }

      const updatedOrder = await res.json()
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    } catch (error) {
      alert('Bir hata oluştu')
    } finally {
      setCancellingId(null)
    }
  }

  const formatTime = (dateString) => {
    // SQLite UTC olarak kaydediyor, Z ekleyerek UTC olarak parse et
    const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z')
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z')
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl animate-bounce">📦</div>
          <p className="mt-4 text-gray-600">Siparişler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="bg-white p-4 border-b sticky top-[72px] z-30">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-primary-500" />
          Siparişlerim
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
          <div className="text-8xl mb-6">📭</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz siparişiniz yok</h3>
          <p className="text-gray-500 mb-6 text-center">İlk siparişinizi vermek için menüye göz atın!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold transition"
          >
            Menüye Git
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Status Header */}
                <div className={`${status.color} px-4 py-3 flex items-center justify-between text-white`}>
                  <div className="flex items-center gap-2 font-semibold">
                    <StatusIcon size={20} />
                    {status.label}
                  </div>
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <Clock size={14} />
                    {formatTime(order.createdAt)}
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-3">
                    {formatDate(order.createdAt)}
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{item.image}</span>
                          <span>{item.name}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </span>
                        <span className="font-medium">₺{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="font-bold">Toplam</span>
                    <span className="font-bold text-lg text-primary-600">₺{order.totalAmount}</span>
                  </div>

                  {/* Cancel Button */}
                  {status.canCancel && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      className="w-full mt-4 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {cancellingId === order.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <XCircle size={18} />
                          Siparişi İptal Et
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                      <p className="text-orange-700 font-medium">🛵 Siparişiniz yolda!</p>
                      <p className="text-orange-600 text-sm">Kısa süre içinde teslim edilecek</p>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-green-700 font-medium">✅ Teslim edildi</p>
                      <p className="text-green-600 text-sm">Afiyet olsun!</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
