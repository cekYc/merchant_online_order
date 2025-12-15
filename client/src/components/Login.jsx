import { useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Phone, ArrowRight, MessageSquare, LogIn, RefreshCw } from 'lucide-react'
import { CartContext } from '../App'

export default function Login() {
  const { customer, setCustomer } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo || '/'

  // Giriş yap: önce telefon, sonra SMS
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Eğer zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (customer) {
      navigate(redirectTo)
    }
  }, [customer, navigate, redirectTo])

  // Geri sayım
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Telefon gönder ve SMS kodu iste
  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')

    const cleanPhone = phone.replace(/\s/g, '')
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(cleanPhone)) {
      setError('Geçerli bir telefon numarası girin (10-11 haneli)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Kod gönderilemedi')
      }

      if (!data.isRegistered) {
        setError('Bu telefon numarası kayıtlı değil. Lütfen önce kayıt olun.')
        return
      }

      setDevCode(data.devCode || '')
      setStep('verify')
      setCountdown(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Kodu doğrula ve giriş yap
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('6 haneli kodu girin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s/g, ''), code })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Doğrulama başarısız')
      }

      if (data.customer) {
        setCustomer(data.customer)
        navigate(redirectTo)
      } else {
        setError('Kullanıcı bulunamadı')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 fade-in min-h-[80vh] flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {step === 'phone' && <Phone size={40} className="text-primary-500" />}
          {step === 'verify' && <MessageSquare size={40} className="text-primary-500" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {step === 'phone' && 'Giriş Yap'}
          {step === 'verify' && 'SMS Doğrulama'}
        </h2>
        <p className="text-gray-500 mt-1">
          {step === 'phone' && 'Telefon numaranızı girin, size SMS ile kod göndereceğiz'}
          {step === 'verify' && `${phone} numarasına gönderilen 6 haneli kodu girin`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Phone Input */}
      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone size={16} className="inline mr-1" />
              Telefon Numarası
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <>
                SMS Kodu Gönder
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t">
            <p className="text-gray-500 text-sm">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </form>
      )}

      {/* Step 2: Code Verification */}
      {step === 'verify' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          {devCode && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
              <span className="font-bold">🔧 Geliştirme Modu:</span> Doğrulama kodu: <span className="font-mono font-bold text-lg">{devCode}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare size={16} className="inline mr-1" />
              Doğrulama Kodu
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 haneli kod"
              className="w-full px-4 py-4 text-2xl text-center tracking-widest font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              autoFocus
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Giriş Yap
              </>
            )}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-500 text-sm">
                Yeni kod isteyebilmek için {countdown} saniye bekleyin
              </p>
            ) : (
              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); }}
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Yeni kod gönder
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
          >
            ← Telefon numarasını değiştir
          </button>
        </form>
      )}
    </div>
  )
}
