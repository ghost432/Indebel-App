import { Shield, Clock, XCircle, Crown } from 'lucide-react'

const VerificationBadge = ({ status, size = 'md', showText = true, premium = false }) => {
  const sizes = {
    xs: { container: 'h-3 w-3', text: 'text-[10px]', image: 'h-3 w-3' },
    sm: { container: 'h-4 w-4', text: 'text-xs', image: 'h-4 w-4' },
    md: { container: 'h-5 w-5', text: 'text-sm', image: 'h-5 w-5' },
    lg: { container: 'h-6 w-6', text: 'text-base', image: 'h-6 w-6' }
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
      icon: XCircle,
      iconColor: 'text-gray-400'
    }
  }

  // Normaliser le statut pour correspondre aux clés de configuration
  let normalizedStatus = status?.toLowerCase()?.trim() || 'non_verifie';
  normalizedStatus = normalizedStatus.replace(/[\s-]/g, '_');
  
  // Si le statut est 'en_attente', utiliser 'en_cours' comme fallback
  const statusKey = normalizedStatus === 'en_attente' ? 'en_cours' : normalizedStatus;
  
  const statusConfig = config[statusKey] || config.non_verifie;
  const Icon = statusConfig.icon;
  // Utiliser 'md' comme taille par défaut si la taille demandée n'existe pas
  const sizeClasses = sizes[size] || sizes.md;

  // On affiche uniquement l'icône sans fond pour coller au style minimaliste demandé
  return (
    <>
      {statusConfig.image ? (
        <img 
          src={statusConfig.image} 
          alt={statusConfig.label}
          title={statusConfig.label}
          className={`${sizeClasses.image} object-contain inline-block`}
          onError={(e) => {
            // Fallback sur icône si image non trouvée
            e.target.style.display = 'none'
            if (e.target.nextElementSibling) {
              e.target.nextElementSibling.style.display = 'inline-block'
            }
          }}
        />
      ) : null}
      <Icon 
        className={`${sizeClasses.image} ${statusConfig.iconColor} inline-block ${statusConfig.image ? 'hidden' : ''}`} 
        title={statusConfig.label}
      />
      {Boolean(premium) && (
        <div 
          className={`${sizeClasses.image} inline-flex items-center justify-center bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full shadow-sm ml-1 align-text-bottom shrink-0`} 
          title="Membre Premium"
        >
          <Crown className="w-[70%] h-[70%]" />
        </div>
      )}
    </>
  )
}

export default VerificationBadge
