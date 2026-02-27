import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Award, Star, Clock, User } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import LabelBadge from '../components/LabelBadge'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../services/axiosConfig'
import labelService from '../services/labelService'

const LabelEligibility = () => {
  const [loading, setLoading] = useState(true)
  const [eligibilityData, setEligibilityData] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [labelStatus, setLabelStatus] = useState(null)
  const [hasLabel, setHasLabel] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchEligibilityData()
  }, [])

  useEffect(() => {
    // Mettre à jour le titre de la page en fonction du statut du label
    if (hasLabel) {
      document.title = 'Label Indebel Obtenu - Indebel'
    } else {
      document.title = 'Éligibilité Label Indebel - Indebel'
    }
  }, [hasLabel])

  const fetchEligibilityData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les données d'éligibilité
      const eligibilityResponse = await axiosInstance.get('/label/eligibility')
      setEligibilityData(eligibilityResponse.data.eligibility)
      setUserStats(eligibilityResponse.data.stats)
      
      // Récupérer le statut du label
      const labelResponse = await labelService.getStatutLabel()
      setLabelStatus(labelResponse.data)
      setHasLabel(labelResponse.data.hasLabel)
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const eligibilityCriteria = [
    {
      id: 'verification',
      label: 'Vérification d\'identité complète',
      description: 'Votre identité doit être vérifiée et approuvée',
      required: true,
      current: user?.statut_verification === 'verifie',
      icon: Shield
    },
    {
      id: 'missions_completed',
      label: 'Missions terminées',
      description: 'Minimum 5 missions terminées avec succès',
      required: 5,
      current: userStats?.missions_completed || 0,
      icon: CheckCircle
    },
    {
      id: 'rating',
      label: 'Note moyenne',
      description: 'Maintenir une note moyenne de 4.5/5 ou plus',
      required: 4.5,
      current: userStats?.average_rating || 0,
      icon: Star
    },
    {
      id: 'response_time',
      label: 'Temps de réponse',
      description: 'Temps de réponse moyen inférieur à 2 heures',
      required: 2,
      current: userStats?.avg_response_time || 0,
      icon: Clock
    },
    {
      id: 'account_age',
      label: 'Ancienneté du compte',
      description: 'Compte actif depuis au moins 3 mois',
      required: 3,
      current: userStats?.account_age_months || 0,
      icon: User
    }
  ]

  const getStatusIcon = (criterion) => {
    const Icon = criterion.icon
    let passed = false
    
    if (criterion.id === 'verification') {
      passed = criterion.current
    } else {
      passed = criterion.current >= criterion.required
    }

    return passed ? (
      <CheckCircle className="h-6 w-6 text-green-500" />
    ) : (
      <XCircle className="h-6 w-6 text-red-500" />
    )
  }

  const getStatusColor = (criterion) => {
    let passed = false
    
    if (criterion.id === 'verification') {
      passed = criterion.current
    } else {
      passed = criterion.current >= criterion.required
    }

    return passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
  }

  const calculateEligibilityScore = () => {
    const passedCriteria = eligibilityCriteria.filter(criterion => {
      if (criterion.id === 'verification') {
        return criterion.current
      }
      return criterion.current >= criterion.required
    }).length

    return (passedCriteria / eligibilityCriteria.length) * 100
  }

  const isEligible = () => {
    return eligibilityCriteria.every(criterion => {
      if (criterion.id === 'verification') {
        return criterion.current
      }
      return criterion.current >= criterion.required
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const eligibilityScore = calculateEligibilityScore()
  const eligible = isEligible()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {hasLabel ? 'Label Indebel Obtenu !' : 'Vérification d\'éligibilité au Label Indebel'}
        </h1>
        <p className="text-gray-600">
          {hasLabel 
            ? 'Félicitations ! Vous avez obtenu le prestigieux Label Indebel'
            : 'Vérifiez si vous remplissez les critères pour obtenir le prestigieux Label Indebel'
          }
        </p>
      </div>

      {/* Statut global */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                hasLabel ? 'bg-green-100' : eligible ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {hasLabel ? (
                  <LabelBadge userId={user?.id} size="lg" />
                ) : eligible ? (
                  <Award className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {hasLabel ? (
                    <>
                      <span>Label Indebel Obtenu !</span>
                      <LabelBadge userId={user?.id} size="md" />
                    </>
                  ) : eligible ? (
                    'Éligible au Label Indebel !'
                  ) : (
                    'Non éligible actuellement'
                  )}
                </h2>
                <p className="text-gray-600">
                  {hasLabel 
                    ? 'Félicitations ! Vous avez obtenu le Label Indebel'
                    : `Score d'éligibilité: ${eligibilityScore.toFixed(0)}%`
                  }
                </p>
              </div>
            </div>
            {eligible && !hasLabel && (
              <Button variant="primary" size="lg">
                Demander le Label
              </Button>
            )}
          </div>

          {/* Barre de progression - masquée si label obtenu */}
          {!hasLabel && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>{eligibilityScore.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    eligible ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${eligibilityScore}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Section spéciale si label déjà obtenu */}
      {hasLabel && labelStatus?.label && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <LabelBadge userId={user?.id} size="lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  🎉 Félicitations ! Votre Label Indebel est actif
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Date d'obtention :</strong> {new Date(labelStatus.label.date_attribution).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Statut :</strong> Actif et visible sur votre profil</p>
                  <p>Votre label apparaît maintenant sur votre profil public, dans la sidebar et vous donne accès à des opportunités exclusives.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Critères d'éligibilité - masqués si label obtenu */}
      {!hasLabel && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Critères d'éligibilité</h3>
            
            {eligibilityCriteria.map((criterion) => {
              const Icon = criterion.icon
              const statusColor = getStatusColor(criterion)
              
              return (
                <Card key={criterion.id} className={`border-2 ${statusColor}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Icon className="h-6 w-6 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{criterion.label}</h4>
                          <p className="text-sm text-gray-600">{criterion.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {criterion.id === 'verification' ? (
                            <span className={`text-sm font-medium ${
                              criterion.current ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {criterion.current ? 'Vérifié' : 'Non vérifié'}
                            </span>
                          ) : (
                            <>
                              <div className="text-lg font-semibold text-gray-900">
                                {criterion.current}
                                {criterion.id === 'rating' && '/5'}
                                {criterion.id === 'response_time' && 'h'}
                                {criterion.id === 'account_age' && ' mois'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Requis: {criterion.required}
                                {criterion.id === 'rating' && '/5'}
                                {criterion.id === 'response_time' && 'h max'}
                                {criterion.id === 'account_age' && ' mois min'}
                              </div>
                            </>
                          )}
                        </div>
                        {getStatusIcon(criterion)}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Conseils pour améliorer l'éligibilité */}
          {!eligible && (
            <Card className="mt-6 border-orange-200 bg-orange-50">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">
                  Comment améliorer votre éligibilité
                </h3>
                <ul className="space-y-2 text-sm text-orange-800">
                  {eligibilityCriteria
                    .filter(criterion => {
                      if (criterion.id === 'verification') {
                        return !criterion.current
                      }
                      return criterion.current < criterion.required
                    })
                    .map(criterion => (
                      <li key={criterion.id} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>
                          {criterion.id === 'verification' && 'Complétez votre vérification d\'identité dans les paramètres'}
                          {criterion.id === 'missions_completed' && `Terminez ${criterion.required - criterion.current} missions supplémentaires`}
                          {criterion.id === 'rating' && 'Améliorez votre note moyenne en fournissant un excellent service'}
                          {criterion.id === 'response_time' && 'Réduisez votre temps de réponse aux messages clients'}
                          {criterion.id === 'account_age' && `Attendez ${criterion.required - criterion.current} mois supplémentaires`}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default LabelEligibility
