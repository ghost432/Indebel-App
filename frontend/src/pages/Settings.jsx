import { useState, useEffect, useRef } from 'react'
import { User, Mail, Briefcase, Lock, Camera, Eye, EyeOff, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import toast from 'react-hot-toast'
import { userService } from '../services/userService'
import { profileService } from '../services/profileService'

const Settings = () => {
  const { user, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const fileInputRef = useRef(null)
  
  // Informations personnelles
  const [personalInfo, setPersonalInfo] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    poste: user?.poste || '',
    email: user?.email || ''
  })

  // Changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    document.title = 'Paramètres - Indebel'
    // Utiliser profileService pour charger l'image
    if (user?.id) {
      const image = profileService.getProfileImage(user)
      if (image) {
        setProfileImage(image)
      }
    }
  }, [user?.id])

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageData = reader.result
        setProfileImage(imageData)
        // Utiliser profileService pour sauvegarder
        await profileService.saveProfileImage(imageData, user?.id)
        toast.success('Photo mise à jour avec succès!')
        checkAuth()
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await userService.updateUser(user.id, {
        prenom: personalInfo.prenom,
        nom: personalInfo.nom,
        poste: personalInfo.poste,
        email: personalInfo.email,
        role: user.role
      })
      toast.success('Informations personnelles mises à jour')
      await checkAuth()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!passwordData.currentPassword) {
      toast.error('Veuillez saisir votre mot de passe actuel')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      toast.success('Mot de passe modifié avec succès')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo de profil */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h3>
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold" />
                  ) : (
                    <span>{profileService.getInitials(user, user?.role)}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-1/2 translate-x-1/2 translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors border-2 border-primary-600"
                  title="Changer la photo"
                >
                  <Camera className="h-5 w-5 text-primary-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-600">
                Cliquez sur l'icône pour modifier votre photo
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG ou GIF (max. 5MB)
              </p>
            </div>
          </Card>

          {/* Info compte */}
          <Card className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span>{user?.prenom} {user?.nom}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span>{user?.email}</span>
              </div>
              {user?.poste && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{user?.poste}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Formulaires */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h3>
            
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  name="prenom"
                  value={personalInfo.prenom}
                  onChange={handlePersonalInfoChange}
                  placeholder="Votre prénom"
                  required
                  icon={User}
                />

                <Input
                  label="Nom *"
                  name="nom"
                  value={personalInfo.nom}
                  onChange={handlePersonalInfoChange}
                  placeholder="Votre nom"
                  required
                  icon={User}
                />
              </div>

              <Input
                label="Email *"
                name="email"
                type="email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                placeholder="votre@email.com"
                required
                icon={Mail}
              />

              <Input
                label="Quel est votre poste ou métier ?"
                name="poste"
                value={personalInfo.poste}
                onChange={handlePersonalInfoChange}
                placeholder="Ex: Développeur, Designer, Consultant..."
                icon={Briefcase}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" loading={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </Card>

          {/* Changer le mot de passe */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Changer le mot de passe</h3>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Sécurité :</strong> Votre mot de passe doit contenir au moins 8 caractères.
                </p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre mot de passe actuel"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nouveau mot de passe (min. 8 caractères)"
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" loading={loading} variant="primary">
                  <Lock className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </div>
            </form>
          </Card>

          {/* Informations supplémentaires */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-yellow-600" />
              Conseils de sécurité
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Utilisez un mot de passe unique pour chaque service</li>
              <li>• Combinez lettres majuscules, minuscules, chiffres et caractères spéciaux</li>
              <li>• Ne partagez jamais votre mot de passe</li>
              <li>• Changez régulièrement votre mot de passe</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Settings
