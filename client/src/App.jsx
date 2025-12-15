import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, createContext } from 'react'
import CustomerApp from './pages/CustomerApp'
import AdminPanel from './pages/AdminPanel'
import CourierPanel from './pages/CourierPanel'

export const CartContext = createContext()

function App() {
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState(null)

  // Load cart and customer from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('esnaf-cart')
    const savedCustomer = localStorage.getItem('esnaf-customer')
    
    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedCustomer) setCustomer(JSON.parse(savedCustomer))
  }, [])

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('esnaf-cart', JSON.stringify(cart))
  }, [cart])

  // Save customer to localStorage
  useEffect(() => {
    if (customer) {
      localStorage.setItem('esnaf-customer', JSON.stringify(customer))
    }
  }, [customer])

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const logout = () => {
    setCustomer(null)
    localStorage.removeItem('esnaf-customer')
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      cartCount,
      customer,
      setCustomer,
      logout
    }}>
      <Routes>
        <Route path="/*" element={<CustomerApp />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/courier" element={<CourierPanel />} />
      </Routes>
    </CartContext.Provider>
  )
}

export default App
