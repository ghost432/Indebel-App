import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Empêcher le mini-infobar par défaut d'apparaître sur mobile
      e.preventDefault();
      // Stocker l'événement pour pouvoir l'utiliser plus tard
      setDeferredPrompt(e);
      // Afficher notre propre bouton d'installation
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre que l'utilisateur réponde au prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`Installation PWA: ${outcome}`);

    // Réinitialiser le prompt différé
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Stocker le refus dans localStorage pour ne plus afficher pendant 7 jours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Vérifier si l'utilisateur a déjà refusé l'installation
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowInstallBanner(false);
      }
    }
  }, []);

  if (!showInstallBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-[320px] max-w-[calc(100vw-3rem)] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/3.png" alt="Indebel" className="h-6 w-6 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">Installer Indebel</h3>
            <p className="text-xs text-gray-500 truncate">Application fluide et rapide</p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
