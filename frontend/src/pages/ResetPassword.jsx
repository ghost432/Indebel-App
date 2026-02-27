import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Mot de passe réinitialisé avec succès');

        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      toast.error(error.response?.data?.message || 'Token invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error('Token manquant');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          {!success ? (
            <>
              {/* Logo et Titre */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img
                    src="/logo.png"
                    alt="Indebel Logo"
                    className="h-20 w-auto"
                  />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Nouveau mot de passe
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Choisissez un nouveau mot de passe sécurisé
                </p>
              </div>

              {/* Formulaire */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 caractères
                  </p>
                </div>

                {/* Confirmer le mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bouton Soumettre */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </Button>
              </form>

              {/* Lien retour */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Retour à la connexion
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Message de succès */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Mot de passe réinitialisé !
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre mot de passe a été réinitialisé avec succès.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Vous allez être redirigé vers la page de connexion...
                </p>
                <Link
                  to="/login"
                  className="inline-block text-primary-600 hover:text-primary-700 font-medium"
                >
                  Se connecter maintenant
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
