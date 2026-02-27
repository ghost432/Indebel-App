import React from 'react';
import { Home } from 'lucide-react';

const PublicHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a 
              href="https://indebel.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img 
                src="/logo.png" 
                alt="Indebel" 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </a>
          </div>

          {/* Bouton retour accueil */}
          <div>
            <a
              href="https://indebel.be"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Accueil</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
