import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FreelancerTopBarLayout = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Indebel
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative">
              <button 
                className="flex items-center space-x-2 focus:outline-none group"
                aria-haspopup="true"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-sm">
                  {user?.prenom?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {user?.prenom || 'Utilisateur'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user?.role === 'freelancer' ? 'Prestataire' : 'Recruteur'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FreelancerTopBarLayout;
