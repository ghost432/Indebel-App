import { Link, useLocation } from 'react-router-dom';
import { Home, User, ClipboardList, Settings, Star, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FreelancerSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="px-4 mb-4 flex justify-center">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="Indebel" 
                className="h-20 w-32 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </Link>
          </div>
          
          {/* Profil */}
          <div className="px-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                {user?.prenom?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.prenom} {user?.nom}
                </p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 font-medium">
                    {user?.role === 'freelancer' ? 'Prestataire' : 'Recruteur'}
                  </p>
                  <Link
                    to={user?.role === 'freelancer' ? '/freelancer/credits' : '/employer/credits'}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors border border-amber-300/60"
                  >
                    <span>{user?.solde_credits || 0} cr.</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            <Link
              to="/freelancer/dashboard"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/dashboard')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/dashboard')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Tableau de bord
            </Link>
            <Link
              to="/freelancer/profile"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/profile')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <User
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/profile')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Mon Profil
            </Link>
            <Link
              to="/freelancer/list-missions"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/list-missions')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ClipboardList
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/list-missions')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Missions disponibles
            </Link>
            <Link
              to="/freelancer/mes-missions"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/mes-missions')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Briefcase
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/mes-missions')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Mes Missions
            </Link>
            
            {/* Sous-menu de Mes Missions */}
            <Link
              to="/freelancer/my-jobs"
              className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/my-jobs')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-gray-400">↳</span>
              Mes missions postulées
            </Link>
            
            <Link
              to="/freelancer/evaluations"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/evaluations')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Star
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/evaluations')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Mes Évaluations
            </Link>
            <Link
              to="/freelancer/settings"
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/freelancer/settings')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings
                className={`mr-3 h-5 w-5 ${
                  isActive('/freelancer/settings')
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              Paramètres
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default FreelancerSidebar;
