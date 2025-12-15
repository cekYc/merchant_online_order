import { useState, useEffect, useContext, useRef } from 'react'
import { Plus, Minus, ChevronRight } from 'lucide-react'
import { CartContext } from '../App'

export default function Menu() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const { cart, addToCart, removeFromCart } = useContext(CartContext)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    fetchMenu()
    fetchCategories()
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateScrollHint = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const hasOverflow = maxScrollLeft > 10
      // Sonda 30px kala veya daha fazla kaydırılmışsa gizle
      const isNearEnd = container.scrollLeft >= maxScrollLeft - 30
      
      if (!hasOverflow || isNearEnd) {
        setShowScrollHint(false)
      } else {
        setShowScrollHint(true)
      }
    }

    container.addEventListener('scroll', updateScrollHint)
    // İlk kontrol için biraz bekle (kategoriler yüklensin)
    const timer = setTimeout(updateScrollHint, 100)
    window.addEventListener('resize', updateScrollHint)

    return () => {
      container.removeEventListener('scroll', updateScrollHint)
      window.removeEventListener('resize', updateScrollHint)
      clearTimeout(timer)
    }
  }, [categories])

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setMenuItems(data)
    } catch (error) {
      console.error('Menü yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
      if (data.length > 0 && !activeCategory) {
        setActiveCategory(data[0].id)
      }
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error)
    }
  }

  const getItemQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId)
    return item ? item.quantity : 0
  }

  const filteredItems = menuItems.filter(item => item.category === activeCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl animate-bounce">🌯</div>
          <p className="mt-4 text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6 rounded-b-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-1">Hoş Geldiniz! 👋</h2>
        <p className="text-primary-100 text-sm">En lezzetli dürümler kapınızda</p>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[72px] z-30 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto category-tabs p-3 gap-2 scroll-smooth"
          >
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
          {/* Scroll Indicator */}
          {showScrollHint && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
              <div className="bg-gradient-to-l from-white via-white/90 to-transparent w-16 h-full flex items-center justify-end pr-2">
                <div className="animate-bounce-x bg-primary-500/20 rounded-full p-1">
                  <ChevronRight size={20} className="text-primary-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-4">
        {filteredItems.map(item => {
          const quantity = getItemQuantity(item.id)
          
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow fade-in"
            >
              <div className="flex gap-4">
                {/* Image/Emoji */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                  {item.image?.startsWith('http') ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    item.image
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                  <p className="text-primary-600 font-bold text-lg mt-1">₺{item.price}</p>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="mt-3 flex justify-end">
                {quantity === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 transition transform active:scale-95"
                  >
                    <Plus size={18} />
                    Ekle
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition"
                    >
                      <Minus size={18} className="text-red-500" />
                    </button>
                    <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-600 transition"
                    >
                      <Plus size={18} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Spacer for bottom cart bar */}
      <div className="h-24"></div>
    </div>
  )
}
