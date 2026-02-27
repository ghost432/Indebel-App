import { Shield, Clock, XCircle } from 'lucide-react'

const VerificationBadge = ({ status, size = 'md', showText = true }) => {
  const sizes = {
    xs: { container: 'h-4 w-4', text: 'text-xs', image: 'h-3 w-3' },
    sm: { container: 'h-6 w-6', text: 'text-xs', image: 'h-5 w-5' },
    md: { container: 'h-8 w-8', text: 'text-sm', image: 'h-7 w-7' },
    lg: { container: 'h-10 w-10', text: 'text-base', image: 'h-9 w-9' }
  }

  const config = {
    verifie: {
      image: '/images/2.png', // Badge vérifié
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-500',
      label: 'Vérifié',
      icon: Shield,
      iconColor: 'text-green-600'
    },
    en_cours: {
      image: null,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-500',
      label: 'En cours',
      icon: Clock,
      iconColor: 'text-blue-600'
    },
    en_attente: {
      image: null,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-500',
      label: 'En attente',
      icon: Clock,
      iconColor: 'text-yellow-600'
    },
    refuse: {
      image: null,
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-500',
      label: 'Refusé',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    non_verifie: {
      image: '/images/1.png', // Badge non vérifié
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-400',
      label: 'Non vérifié',
      icon: Shield,
      iconColor: 'text-gray-500'
    }
  }

  // Normaliser le statut pour correspondre aux clés de configuration
  const normalizedStatus = status?.toLowerCase() || 'non_verifie';
  
  // Si le statut est 'en_attente', utiliser 'en_cours' comme fallback
  const statusKey = normalizedStatus === 'en_attente' ? 'en_cours' : normalizedStatus;
  
  const statusConfig = config[statusKey] || config.non_verifie;
  const Icon = statusConfig.icon;
  // Utiliser 'md' comme taille par défaut si la taille demandée n'existe pas
  const sizeClasses = sizes[size] || sizes.md;

  // Si showText est faux, on affiche uniquement l'icône sans fond
  if (!showText) {
    return statusConfig.image ? (
      <img 
        src={statusConfig.image} 
        alt={statusConfig.label}
        className={`${sizeClasses.image} object-contain`}
        onError={(e) => {
          // Fallback sur icône si image non trouvée
          e.target.style.display = 'none'
          e.target.nextElementSibling.style.display = 'block'
        }}
      />
    ) : (
      <Icon className={`${sizeClasses.image} ${statusConfig.iconColor}`} />
    )
  }

  // Si showText est vrai, on affiche le badge complet avec texte
  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
      {/* Image badge ou icône */}
      {statusConfig.image ? (
        <img 
          src={statusConfig.image} 
          alt={statusConfig.label}
          className={`${sizeClasses.image} object-contain`}
          onError={(e) => {
            // Fallback sur icône si image non trouvée
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'block'
          }}
        />
      ) : null}
      <Icon className={`${sizeClasses.container} ${statusConfig.iconColor} ${statusConfig.image ? 'hidden' : ''}`} />
      
      {/* Texte */}
      <span className={`${sizeClasses.text} font-medium ${statusConfig.textColor} whitespace-nowrap`}>
        {statusConfig.label}
      </span>
    </div>
  )
}

export default VerificationBadge
