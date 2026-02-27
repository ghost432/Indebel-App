// Script de diagnostic pour les problèmes d'authentification
console.log('🔧 Script de diagnostic chargé');

// Observer les changements de localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;
const originalClear = localStorage.clear;

localStorage.setItem = function(key, value) {
  if (key === 'token' || key === 'user') {
    console.log(`📝 localStorage.setItem: ${key} = ${value?.substring(0, 50)}...`);
  }
  originalSetItem.call(this, key, value);
};

localStorage.removeItem = function(key) {
  if (key === 'token' || key === 'user') {
    console.log(`🗑️ localStorage.removeItem: ${key}`);
  }
  originalRemoveItem.call(this, key);
};

localStorage.clear = function() {
  console.log('💥 localStorage.clear() appelé - ATTENTION !');
  console.trace(); // Affiche la stack trace
  originalClear.call(this);
};

// Log des changements d'URL
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log(`🌐 Navigation: ${lastUrl} → ${currentUrl}`);
    lastUrl = currentUrl;
  }
}).observe(document, {subtree: true, childList: true});

// Observer les erreurs de réseau
window.addEventListener('error', (e) => {
  if (e.message.includes('401')) {
    console.log('❌ Erreur réseau 401 détectée:', e);
  }
});

console.log('✅ Monitoring actif - vérifiez les logs lors de la connexion');
