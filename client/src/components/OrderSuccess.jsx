import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home } from 'lucide-react'

export default function OrderSuccess() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 fade-in">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 pulse">
        <CheckCircle size={60} className="text-green-500" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Siparişiniz Alındı! 🎉
      </h1>
      
      <p className="text-gray-600 text-center mb-2">
        Siparişiniz hazırlanmaya başlandı.
      </p>
      <p className="text-gray-500 text-center text-sm mb-8">
        En kısa sürede kapınızda olacak!
      </p>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8 w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🌯</span>
          <div>
            <p className="font-semibold text-primary-800">Tahmini Teslimat</p>
            <p className="text-primary-600">30-45 dakika</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition"
      >
        <Home size={20} />
        Ana Sayfaya Dön
      </button>
    </div>
  )
}
