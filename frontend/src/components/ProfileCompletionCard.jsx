import { useState, useEffect } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from './Card'
import Button from './Button'

const ProfileCompletionCard = ({ user }) => {
  const navigate = useNavigate()
  const [missingFields, setMissingFields] = useState([])
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    if (!user) return

    const missing = []
    let totalFields = 0
    let filledFields = 0

    if (user.role === 'employer') {
      // Champs obligatoires pour employer
      const fields = [
        { key: 'denomination', label: 'Dénomination de l\'entreprise' },
        { key: 'numero_bce', label: 'Numéro BCE' },
        { key: 'adresse', label: 'Adresse de l\'entreprise' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'nom', label: 'Nom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'secteur', label: 'Secteur d\'activité' },
        { key: 'competences_recherchees', label: 'Compétences recherchées', isArray: true },
        { key: 'photo_profil', label: 'Photo de profil' }
      ]

      fields.forEach(field => {
        totalFields++
        if (field.isArray) {
          if (!user[field.key] || user[field.key].length === 0) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        } else {
          const value = user[field.key]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        }
      })
    } else if (user.role === 'freelancer') {
      // Champs obligatoires pour freelancer
      const fields = [
        { key: 'prenom', label: 'Prénom' },
        { key: 'nom', label: 'Nom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'secteur', label: 'Secteur d\'activité' },
        { key: 'competences', label: 'Compétences', isArray: true },
        { key: 'langues_parlees', label: 'Langues parlées', isArray: true },
        { key: 'experience', label: 'Expérience professionnelle' },
        { key: 'photo_profil', label: 'Photo de profil' }
      ]

      fields.forEach(field => {
        totalFields++
        if (field.isArray) {
          if (!user[field.key] || user[field.key].length === 0) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        } else {
          const value = user[field.key]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        }
      })
    }

    setMissingFields(missing)
    setCompletionPercentage(Math.round((filledFields / totalFields) * 100))
  }, [user])

  if (!user || missingFields.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden border border-[#2A4DEF]/10 bg-gradient-to-br from-white via-white to-[#2A4DEF]/5 shadow-xl shadow-[#082151]/5">
      <div className="relative">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#c02525]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c02525] to-[#082151] text-white shadow-lg shadow-[#c02525]/20">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#c02525]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#c02525]">
                <AlertCircle className="h-3.5 w-3.5" />
                Profil incomplet
              </div>
              <h3 className="mt-3 text-xl font-black text-[#082151]">Complétez votre profil</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Votre profil est complété à <strong className="text-[#082151]">{completionPercentage}%</strong>.
                Ajoutez les informations manquantes pour renforcer votre visibilité.
              </p>
            </div>
          </div>

          <Button 
            onClick={() => navigate(`/${user.role}/profile`)}
            className="shrink-0 rounded-full bg-[#c02525] px-5 shadow-lg shadow-[#c02525]/20 hover:bg-[#a91f1f]"
          >
            Compléter mon profil
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#c02525] via-[#2A4DEF] to-[#082151] transition-all duration-700"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white/80 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Informations manquantes</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missingFields.slice(0, 5).map((field, index) => (
              <li key={index} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2A4DEF]" />
                <span>{field}</span>
              </li>
            ))}
            {missingFields.length > 5 && (
              <li className="rounded-xl bg-[#c02525]/10 px-3 py-2 text-sm font-bold text-[#c02525]">
                + {missingFields.length - 5} autre(s) champ(s)
              </li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default ProfileCompletionCard
