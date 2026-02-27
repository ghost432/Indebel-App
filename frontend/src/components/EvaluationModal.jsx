import { useState } from 'react'
import { Star, Check } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const EvaluationModal = ({ isOpen, onClose, freelancer, onSubmit }) => {
  const [step, setStep] = useState(1) // 1: Choix, 2: Formulaire
  const [note, setNote] = useState(0)
  const [hoverNote, setHoverNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [qualiteTravail, setQualiteTravail] = useState(0)
  const [respectDelais, setRespectDelais] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [recommandation, setRecommandation] = useState(true)

  const handleSubmitSansEvaluation = () => {
    onSubmit({ avec_evaluation: false })
    resetForm()
    onClose()
  }

  const handleSubmitAvecEvaluation = () => {
    if (note === 0 || qualiteTravail === 0 || respectDelais === 0 || communication === 0) {
      return
    }

    onSubmit({
      avec_evaluation: true,
      evaluation: {
        note,
        commentaire,
        qualite_travail: qualiteTravail,
        respect_delais: respectDelais,
        communication,
        recommandation
      }
    })
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setStep(1)
    setNote(0)
    setHoverNote(0)
    setCommentaire('')
    setQualiteTravail(0)
    setRespectDelais(0)
    setCommunication(0)
    setRecommandation(true)
  }

  const StarRating = ({ value, onChange, label }) => {
    const [hover, setHover] = useState(0)

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hover || value)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title={step === 1 ? 'Marquer comme terminé' : 'Évaluer le freelancer'}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-900">
              Souhaitez-vous évaluer le travail de{' '}
              <strong>{freelancer?.prenom} {freelancer?.nom}</strong> ?
            </p>
          </div>

          <p className="text-gray-700">
            Une évaluation aide les autres recruteurs à faire leur choix et améliore
            la visibilité de le prestataire sur la plateforme.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600"
            >
              <Star className="h-4 w-4 mr-2" />
              Oui, évaluer le prestataire
            </Button>
            <Button
              onClick={handleSubmitSansEvaluation}
              variant="outline"
              className="w-full"
            >
              Non, marquer terminé sans avis
            </Button>
            <Button
              onClick={() => {
                resetForm()
                onClose()
              }}
              variant="outline"
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Évaluation de le prestataire <strong>{freelancer?.prenom} {freelancer?.nom}</strong>
            </p>
          </div>

          {/* Note globale */}
          <StarRating
            value={note}
            onChange={setNote}
            label="Note globale *"
          />

          {/* Critères détaillés */}
          <StarRating
            value={qualiteTravail}
            onChange={setQualiteTravail}
            label="Qualité du travail *"
          />

          <StarRating
            value={respectDelais}
            onChange={setRespectDelais}
            label="Respect des délais *"
          />

          <StarRating
            value={communication}
            onChange={setCommunication}
            label="Communication *"
          />

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre avis (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Partagez votre expérience avec ce freelancer..."
            />
          </div>

          {/* Recommandation */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="recommandation"
              checked={recommandation}
              onChange={(e) => setRecommandation(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="recommandation" className="ml-2 block text-sm text-gray-700">
              Je recommande cet prestataire
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmitAvecEvaluation}
              disabled={note === 0 || qualiteTravail === 0 || respectDelais === 0 || communication === 0}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Soumettre l'évaluation
            </Button>
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1"
            >
              Retour
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default EvaluationModal
