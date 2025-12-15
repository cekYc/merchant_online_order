import { useState, useEffect, useContext } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, ArrowLeft, Package } from 'lucide-react'
import { CartContext } from '../App'
import Menu from '../components/Menu'
import Cart from '../components/Cart'
import Checkout from '../components/Checkout'
import Register from '../components/Register'
import OrderSuccess from '../components/OrderSuccess'
import MyOrders from '../components/MyOrders'

export default function CustomerApp() {
  const { cartCount, customer } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  const isHome = location.pathname === '/'
  const showBackButton = !isHome

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div onClick={() => navigate('/')} className="cursor-pointer">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🌯 Tavux Dürüm
              </h1>
              <p className="text-xs text-primary-100">Lezzetin Adresi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {customer && (
              <>
                <button 
                  onClick={() => navigate('/orders')}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  title="Siparişlerim"
                >
                  <Package size={22} />
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  title={customer.firstName}
                >
                  <User size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/register" element={<Register />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/orders" element={<MyOrders />} />
        </Routes>
      </main>

      {/* Bottom Cart Bar */}
      {cartCount > 0 && location.pathname === '/' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl slide-up">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-between transition transform active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white text-primary-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </div>
                <span>Sepeti Gör</span>
              </div>
              <ShoppingCart size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
