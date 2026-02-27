import { useState, useEffect } from 'react'
import { Star, TrendingUp, Award, ThumbsUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { evaluationService } from '../services/evaluationService'
import Card from '../components/Card'
import toast from 'react-hot-toast'

const FreelancerEvaluations = () => {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState([])
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    document.title = 'Mes Évaluations - Indebel'
    if (user?.id) {
      fetchEvaluations()
    }
  }, [user, page])

  const fetchEvaluations = async () => {
    try {
      const response = await evaluationService.getFreelancerEvaluations(user.id, page, 10)
      setEvaluations(response.data.data.evaluations)
      setStats(response.data.data.stats)
      setDistribution(response.data.data.distribution)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des évaluations')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (note) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const noteMoyenne = stats?.note_moyenne ? parseFloat(stats.note_moyenne).toFixed(1) : '0.0'
  const totalEvaluations = stats?.total_evaluations || 0
  const tauxRecommandation = totalEvaluations > 0 
    ? Math.round((stats.total_recommandations / totalEvaluations) * 100)
    : 0

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Évaluations</h1>
        <p className="text-gray-600">Consultez les avis laissés par les employeurs</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Note moyenne</p>
              <p className="text-4xl font-bold text-yellow-700">{noteMoyenne}</p>
              <div className="mt-2">{renderStars(Math.round(parseFloat(noteMoyenne)))}</div>
            </div>
            <Star className="h-12 w-12 text-yellow-300" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total évaluations</p>
              <p className="text-4xl font-bold text-blue-700">{totalEvaluations}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-300" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Recommandations</p>
              <p className="text-4xl font-bold text-green-700">{tauxRecommandation}%</p>
            </div>
            <ThumbsUp className="h-12 w-12 text-green-300" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Qualité moyenne</p>
              <p className="text-4xl font-bold text-purple-700">
                {stats?.qualite_moyenne ? parseFloat(stats.qualite_moyenne).toFixed(1) : '0.0'}
              </p>
            </div>
            <Award className="h-12 w-12 text-purple-300" />
          </div>
        </Card>
      </div>

      {/* Critères détaillés */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Critères d'évaluation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Qualité du travail</span>
              <span className="text-lg font-bold text-gray-900">
                {stats?.qualite_moyenne ? parseFloat(stats.qualite_moyenne).toFixed(1) : '0.0'}/5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((stats?.qualite_moyenne || 0) / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Respect des délais</span>
              <span className="text-lg font-bold text-gray-900">
                {stats?.delais_moyen ? parseFloat(stats.delais_moyen).toFixed(1) : '0.0'}/5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                style={{ width: `${((stats?.delais_moyen || 0) / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Communication</span>
              <span className="text-lg font-bold text-gray-900">
                {stats?.communication_moyenne ? parseFloat(stats.communication_moyenne).toFixed(1) : '0.0'}/5
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((stats?.communication_moyenne || 0) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des évaluations */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Avis reçus</h2>
        
        {evaluations.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucune évaluation pour le moment</p>
              <p className="text-gray-500 text-sm mt-2">
                Complétez vos premières missions pour recevoir des évaluations
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                      {evaluation.employer_denomination?.charAt(0) || 
                       evaluation.employer_prenom?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {evaluation.employer_denomination || 
                         `${evaluation.employer_prenom} ${evaluation.employer_nom}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(evaluation.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {renderStars(evaluation.note)}
                    <span className="text-2xl font-bold text-gray-900 mt-1">
                      {evaluation.note}/5
                    </span>
                  </div>
                </div>

                {evaluation.commentaire && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700">{evaluation.commentaire}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Qualité</p>
                    <p className="text-lg font-bold text-blue-700">{evaluation.qualite_travail}/5</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Délais</p>
                    <p className="text-lg font-bold text-green-700">{evaluation.respect_delais}/5</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Communication</p>
                    <p className="text-lg font-bold text-purple-700">{evaluation.communication}/5</p>
                  </div>
                </div>

                {evaluation.recommandation && (
                  <div className="mt-4 flex items-center text-green-600">
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Recommandé par cet employeur</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FreelancerEvaluations
