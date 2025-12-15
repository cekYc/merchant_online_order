import { createContext, useState, useEffect } from 'react'

export const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(true)

  // Token varsa verify et
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          setAdmin(data.admin)
        } else {
          // Token geçersiz
          localStorage.removeItem('adminToken')
          setToken(null)
        }
      } catch (error) {
        console.error('Token verify error:', error)
        localStorage.removeItem('adminToken')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const login = async (username, password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Giriş başarısız')
    }

    localStorage.setItem('adminToken', data.token)
    setToken(data.token)
    setAdmin(data.admin)
    return data
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
    setAdmin(null)
  }

  // API istekleri için auth header ekleyen helper
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }

    // FormData için Content-Type'ı kaldır
    if (options.body instanceof FormData) {
      delete headers['Content-Type']
    }

    const res = await fetch(url, {
      ...options,
      headers
    })

    // 401 hatası alırsak logout yap
    if (res.status === 401) {
      logout()
      throw new Error('Oturum süresi doldu, lütfen tekrar giriş yapın')
    }

    return res
  }

  return (
    <AdminContext.Provider value={{
      admin,
      token,
      loading,
      login,
      logout,
      authFetch,
      isAuthenticated: !!admin
    }}>
      {children}
    </AdminContext.Provider>
  )
}
