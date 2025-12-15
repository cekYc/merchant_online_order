import { useState, useEffect, useRef, useContext } from 'react'
import { io } from 'socket.io-client'
import { 
  Phone, MapPin, Clock, CreditCard, Banknote, Smartphone,
  CheckCircle, ChefHat, Truck, XCircle, Bell, RefreshCw,
  Plus, Edit2, Trash2, Save, X, Package, Settings, Copy, Check, FolderPlus, Upload, Image, LogOut, Key
} from 'lucide-react'
import { AdminContext } from '../contexts/AdminContext'

const socket = io('http://localhost:3001')

const statusConfig = {
  pending: { 
    label: 'Yeni Sipariş', 
    color: 'bg-yellow-500', 
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: Bell
  },
  preparing: { 
    label: 'Hazırlanıyor', 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50 border-blue-200',
    icon: ChefHat
  },
  ready: { 
    label: 'Hazır', 
    color: 'bg-purple-500', 
    bgColor: 'bg-purple-50 border-purple-200',
    icon: CheckCircle
  },
  out_for_delivery: { 
    label: 'Yolda', 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50 border-orange-200',
    icon: Truck
  },
  delivered: { 
    label: 'Teslim Edildi', 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50 border-green-200',
    icon: CheckCircle
  },
  cancelled: { 
    label: 'İptal', 
    color: 'bg-red-500', 
    bgColor: 'bg-red-50 border-red-200',
    icon: XCircle
  }
}

const paymentLabels = {
  door_cash: { label: 'Kapıda Nakit', icon: Banknote, color: 'text-green-600' },
  door_card: { label: 'Kapıda Kart', icon: CreditCard, color: 'text-blue-600' },
  online: { label: 'Online Ödeme', icon: Smartphone, color: 'text-purple-600' }
}

export default function AdminDashboard() {
  const { admin, logout, authFetch } = useContext(AdminContext)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('orders') // 'orders' or 'menu'
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: 'durum', image: '🌯'
  })
  const [newCategory, setNewCategory] = useState({
    id: '', name: '', emoji: '🍽️'
  })

  const [newOrderSound] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR8LVK7d0NaBVA8lgt+/0a1/FwkqfeLI0aF/GwcsfOXM0Z5/HQYreuXN0Z5/HQYreuXN0Z5/HQ==')
      return audio
    }
    return null
  })

  useEffect(() => {
    fetchOrders()
    fetchMenu()
    fetchCategories()

    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev])
      if (newOrderSound) {
        newOrderSound.play().catch(() => {})
      }
      if (Notification.permission === 'granted') {
        new Notification('🌯 Yeni Sipariş!', {
          body: `${order.firstName} ${order.lastName} - ₺${order.totalAmount}`,
          icon: '🌯'
        })
      }
    })

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    })

    socket.on('menuUpdated', () => {
      fetchMenu()
    })

    socket.on('categoriesUpdated', () => {
      fetchCategories()
    })

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      socket.off('newOrder')
      socket.off('orderUpdated')
      socket.off('menuUpdated')
      socket.off('categoriesUpdated')
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await authFetch('/api/orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenu = async () => {
    try {
      const res = await authFetch('/api/admin/menu')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      console.error('Menü yüklenemedi:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
    } catch (error) {
      console.error('Durum güncellenemedi:', error)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      alert('Ad, fiyat ve kategori zorunludur')
      return
    }

    try {
      await authFetch('/api/admin/menu', {
        method: 'POST',
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price)
        })
      })
      setShowAddModal(false)
      setNewItem({ name: '', description: '', price: '', category: 'durum', image: '🌯' })
    } catch (error) {
      console.error('Ürün eklenemedi:', error)
    }
  }

  const handleUpdateItem = async (item) => {
    try {
      await authFetch(`/api/admin/menu/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(item)
      })
      setEditingItem(null)
    } catch (error) {
      console.error('Ürün güncellenemedi:', error)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    try {
      await authFetch(`/api/admin/menu/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Ürün silinemedi:', error)
    }
  }

  const handleImageUpload = async (file, isEdit = false) => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error('Yükleme başarısız')
      }

      const data = await res.json()
      const imageUrl = `http://localhost:3001${data.url}`

      if (isEdit) {
        setEditingItem(prev => ({ ...prev, image: imageUrl }))
      } else {
        setNewItem(prev => ({ ...prev, image: imageUrl }))
      }
    } catch (error) {
      console.error('Görsel yüklenemedi:', error)
      alert('Görsel yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.id || !newCategory.name) {
      alert('ID ve kategori adı zorunludur')
      return
    }

    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory)
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Kategori eklenemedi')
        return
      }

      setShowAddCategoryModal(false)
      setNewCategory({ id: '', name: '', emoji: '🍽️' })
    } catch (error) {
      console.error('Kategori eklenemedi:', error)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    const itemCount = menuItems.filter(item => item.category === categoryId).length
    
    if (itemCount > 0) {
      alert(`Bu kategoride ${itemCount} ürün var. Önce ürünleri silmeniz veya başka kategoriye taşımanız gerekiyor.`)
      return
    }

    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return

    try {
      const res = await authFetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Kategori silinemedi')
      }
    } catch (error) {
      console.error('Kategori silinemedi:', error)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Tüm alanları doldurun')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı')
      return
    }
    
    try {
      const res = await authFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        setPasswordError(data.error || 'Şifre değiştirilemedi')
        return
      }
      
      setPasswordSuccess('Şifre başarıyla değiştirildi!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (error) {
      setPasswordError('Bir hata oluştu')
    }
  }

  const formatTime = (dateString) => {
    // SQLite UTC olarak kaydediyor, Z ekleyerek UTC olarak parse et
    const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z')
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z')
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  // Sipariş ID'sini kısa göster (son 8 karakter)
  const shortId = (id) => id.slice(-8).toUpperCase()

  // ID'yi panoya kopyala
  const copyToClipboard = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Kopyalama başarısız:', err)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const preparingCount = orders.filter(o => o.status === 'preparing').length

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🌯 Esnaf Dürüm
              <span className="text-sm font-normal text-gray-400">| Tezgah Paneli</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold animate-pulse">
                {pendingCount} Yeni Sipariş!
              </div>
            )}
            {preparingCount > 0 && (
              <div className="bg-blue-500 px-4 py-2 rounded-full font-bold">
                {preparingCount} Hazırlanıyor
              </div>
            )}
            <button 
              onClick={() => { fetchOrders(); fetchMenu(); }}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="Yenile"
            >
              <RefreshCw size={24} />
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
              <span className="text-gray-400 text-sm">{admin?.username}</span>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
                title="Şifre Değiştir"
              >
                <Key size={20} />
              </button>
              <button 
                onClick={logout}
                className="p-2 hover:bg-red-600 bg-red-500/20 text-red-400 hover:text-white rounded-lg transition"
                title="Çıkış Yap"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium flex items-center gap-2 transition ${
              activeTab === 'orders' 
                ? 'border-b-2 border-primary-500 text-primary-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package size={20} />
            Siparişler
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 font-medium flex items-center gap-2 transition ${
              activeTab === 'menu' 
                ? 'border-b-2 border-primary-500 text-primary-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={20} />
            Menü Yönetimi
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Filter Tabs */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto flex overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 font-medium transition ${
                  filter === 'all' ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                Tümü ({orders.length})
              </button>
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
                    filter === key ? 'border-b-2 border-primary-500 text-primary-500' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
                  {config.label} ({orders.filter(o => o.status === key).length})
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid */}
          <main className="max-w-7xl mx-auto p-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 text-lg">Sipariş bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const payment = paymentLabels[order.paymentMethod] || paymentLabels.door_cash
                  const StatusIcon = status.icon
                  const PaymentIcon = payment.icon

                  return (
                    <div
                      key={order.id}
                      className={`bg-gray-800 rounded-xl overflow-hidden border ${status.bgColor} transition-all hover:shadow-xl`}
                    >
                      {/* Order Header */}
                      <div className={`${status.color} px-4 py-2 flex items-center justify-between`}>
                        <div className="flex items-center gap-2 font-bold">
                          <StatusIcon size={18} />
                          {status.label}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock size={14} />
                          {formatTime(order.createdAt)}
                        </div>
                      </div>

                      {/* Order ID - Copyable */}
                      <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Sipariş ID: <span className="font-mono font-bold text-yellow-400">#{shortId(order.id)}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(shortId(order.id))}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                            copiedId === shortId(order.id) 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                          title="Kurye için ID kopyala"
                        >
                          {copiedId === shortId(order.id) ? (
                            <>
                              <Check size={12} />
                              Kopyalandı
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Kopyala
                            </>
                          )}
                        </button>
                      </div>

                      {/* Customer Info */}
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="font-bold text-lg mb-2">
                          {order.firstName} {order.lastName}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2 text-gray-300">
                            <Phone size={14} className="text-primary-500" />
                            <a href={`tel:${order.phone}`} className="hover:text-primary-500">
                              {order.phone}
                            </a>
                          </p>
                          <p className="flex items-start gap-2 text-gray-300">
                            <MapPin size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                            {order.address}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4 border-b border-gray-700">
                        <h4 className="font-semibold text-sm text-gray-400 mb-2">SİPARİŞ</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                <span className="text-xl">{item.image}</span>
                                <span>{item.name}</span>
                                <span className="text-gray-500">x{item.quantity}</span>
                              </span>
                              <span className="font-semibold">₺{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {order.note && (
                          <div className="mt-3 p-2 bg-gray-700 rounded-lg text-sm">
                            <span className="text-gray-400">Not:</span> {order.note}
                          </div>
                        )}
                      </div>

                      {/* Payment & Total */}
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className={`flex items-center gap-2 ${payment.color}`}>
                            <PaymentIcon size={18} />
                            <span className="font-medium">{payment.label}</span>
                          </div>
                          <div className="text-2xl font-bold text-primary-500">
                            ₺{order.totalAmount}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, 'preparing')}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                            >
                              <ChefHat size={18} />
                              Hazırla
                            </button>
                            <button
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                            >
                              <XCircle size={18} />
                              İptal
                            </button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateStatus(order.id, 'ready')}
                            className="col-span-2 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <CheckCircle size={18} />
                            Hazır
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateStatus(order.id, 'out_for_delivery')}
                            className="col-span-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Truck size={18} />
                            Yola Çıktı
                          </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <div className="col-span-2 text-center text-orange-400 text-sm py-2">
                            Kurye teslimat yapacak
                          </div>
                        )}
                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                          <div className="col-span-2 text-center text-gray-500 text-sm py-2">
                            {formatDate(order.createdAt)} - {formatTime(order.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </>
      ) : (
        /* Menu Management */
        <main className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Menü Yönetimi</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <FolderPlus size={20} />
                Yeni Kategori
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <Plus size={20} />
                Yeni Ürün
              </button>
            </div>
          </div>

          {categories.map(category => {
            const categoryItemCount = menuItems.filter(item => item.category === category.id).length
            return (
            <div key={category.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {category.emoji} {category.name}
                  <span className="text-sm font-normal text-gray-500">({categoryItemCount} ürün)</span>
                </h3>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition ${
                    categoryItemCount > 0 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  disabled={categoryItemCount > 0}
                  title={categoryItemCount > 0 ? 'Kategoride ürün var' : 'Kategoriyi sil'}
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems
                  .filter(item => item.category === category.id)
                  .map(item => (
                    <div
                      key={item.id}
                      className={`bg-gray-800 rounded-xl p-4 border ${
                        item.available ? 'border-gray-700' : 'border-red-500 opacity-60'
                      }`}
                    >
                      {editingItem?.id === item.id ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="Ürün adı"
                          />
                          <input
                            type="text"
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="Açıklama"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editingItem.price}
                              onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                              placeholder="Fiyat"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Görsel</label>
                            <input
                              ref={editFileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleImageUpload(e.target.files[0], true)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              disabled={uploading}
                              className="w-full px-3 py-2 mb-2 bg-gray-600 border border-gray-500 border-dashed rounded-lg text-white hover:bg-gray-500 transition flex items-center justify-center gap-2 text-sm"
                            >
                              {uploading ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  Yükleniyor...
                                </>
                              ) : (
                                <>
                                  <Upload size={14} />
                                  Görsel Yükle
                                </>
                              )}
                            </button>
                            <input
                              type="text"
                              value={editingItem.image}
                              onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                              placeholder="🌯 veya URL"
                            />
                            {editingItem.image && (
                              <div className="mt-2">
                                {editingItem.image.startsWith('http') ? (
                                  <img src={editingItem.image} alt="Önizleme" className="w-16 h-16 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center text-3xl">
                                    {editingItem.image}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingItem.available}
                              onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                              className="w-5 h-5"
                            />
                            <span>Satışta</span>
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateItem(editingItem)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                            >
                              <Save size={18} />
                              Kaydet
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-4 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="w-14 h-14 flex items-center justify-center text-4xl rounded-lg overflow-hidden bg-gray-700">
                                {item.image?.startsWith('http') ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  item.image
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold">{item.name}</h4>
                                <p className="text-gray-400 text-sm">{item.description}</p>
                                <p className="text-primary-500 font-bold text-lg mt-1">₺{item.price}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => setEditingItem({ ...item })}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                            >
                              <Edit2 size={16} />
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="px-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {!item.available && (
                            <div className="mt-2 text-center text-red-400 text-sm">
                              Satışta değil
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )})}
        </main>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Yeni Ürün Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="örn: Tavuk Dürüm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="örn: Izgara tavuk, domates, marul..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fiyat (₺) *</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="85"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Görsel</label>
                <div className="space-y-2">
                  {/* Dosya Yükleme */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e.target.files[0], false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 border-dashed rounded-lg text-white hover:bg-gray-600 transition flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Görsel Yükle (PNG, JPG, GIF)
                      </>
                    )}
                  </button>
                  
                  {/* Veya Emoji/URL */}
                  <div className="text-center text-gray-500 text-xs">veya</div>
                  <input
                    type="text"
                    value={newItem.image}
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="🌯 emoji veya URL yapıştır"
                  />
                  
                  {/* Önizleme */}
                  {newItem.image && (
                    <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
                      {newItem.image.startsWith('http') ? (
                        <img src={newItem.image} alt="Önizleme" className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center text-3xl">
                          {newItem.image}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">Önizleme</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Kategori *</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddItem}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
                >
                  Ekle
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Yeni Kategori Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Kategori ID *</label>
                <input
                  type="text"
                  value={newCategory.id}
                  onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="örn: tatli"
                />
                <p className="text-xs text-gray-500 mt-1">Boşluk olmadan, küçük harflerle</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Kategori Adı *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="örn: Tatlılar"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Emoji</label>
                <input
                  type="text"
                  value={newCategory.emoji}
                  onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false)
                    setNewCategory({ id: '', name: '', emoji: '🍽️' })
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key size={24} />
              Şifre Değiştir
            </h3>
            
            {passwordError && (
              <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm mb-4">
                ✓ {passwordSuccess}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mevcut Şifre</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold"
                >
                  Değiştir
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
