import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { CartContext } from '../App'

export default function Cart() {
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, customer } = useContext(CartContext)
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 fade-in">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sepetiniz Boş</h2>
        <p className="text-gray-500 mb-6 text-center">Lezzetli dürümlerimizi keşfetmeye başlayın!</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold transition"
        >
          Menüye Git
        </button>
      </div>
    )
  }

  const handleCheckout = () => {
    if (!customer) {
      navigate('/register', { state: { redirectTo: '/checkout' } })
    } else {
      navigate('/checkout')
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-primary-500" />
            Sepetim
          </h2>
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={16} />
            Temizle
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-3">
        {cart.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
          >
            {/* Emoji */}
            <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {item.image}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <p className="text-primary-600 font-bold">₺{item.price}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 transition"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <span className="font-bold w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => addToCart(item)}
                className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-white border-t mt-4">
        <div className="space-y-2 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-gray-600 text-sm">
              <span>{item.name} x{item.quantity}</span>
              <span>₺{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Toplam</span>
            <span className="text-primary-600">₺{cartTotal}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl font-semibold transition transform active:scale-98"
        >
          {customer ? 'Siparişi Onayla' : 'Devam Et'}
        </button>
      </div>
    </div>
  )
}
