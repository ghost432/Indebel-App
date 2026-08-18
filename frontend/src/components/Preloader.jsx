import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const Preloader = () => {
  const [loading, setLoading] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(timer)
  }, [location.pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-white/70 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
      <div className="flex flex-col items-center">
        <img 
          src="/3.png" 
          alt="Chargement..." 
          className="w-14 h-14 object-contain animate-pulse sm:w-16 sm:h-16"
        />
        <div className="mt-3 h-0.5 w-20 overflow-hidden rounded-full bg-gray-200 sm:w-24">
          <div className="h-full rounded-full bg-[#2A4DEF] animate-[loading_0.9s_ease-in-out_infinite]" style={{ width: '50%', transformOrigin: 'left' }}></div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

export default Preloader
