import { useState, useEffect } from 'react';
import Button from '../components/Button';

const StorageDiagnostic = () => {
  const [storageState, setStorageState] = useState({});

  const checkStorage = () => {
    const state = {
      localStorage: {
        available: true,
        token: null,
        tokenLength: 0,
        error: null
      },
      sessionStorage: {
        available: true,
        token: null,
        tokenLength: 0,
        error: null
      }
    };

    // Test localStorage
    try {
      const token = localStorage.getItem('token');
      state.localStorage.token = token;
      state.localStorage.tokenLength = token?.length || 0;
      
      // Test write
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      state.localStorage.available = false;
      state.localStorage.error = error.message;
    }

    // Test sessionStorage
    try {
      const token = sessionStorage.getItem('token');
      state.sessionStorage.token = token;
      state.sessionStorage.tokenLength = token?.length || 0;
      
      // Test write
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
    } catch (error) {
      state.sessionStorage.available = false;
      state.sessionStorage.error = error.message;
    }

    setStorageState(state);
  };

  useEffect(() => {
    checkStorage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Diagnostic du Stockage</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* localStorage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">localStorage</h2>
            <div className="space-y-2">
              <p><strong>Disponible:</strong> {storageState.localStorage?.available ? '✅ Oui' : '❌ Non'}</p>
              {storageState.localStorage?.error && (
                <p className="text-red-600"><strong>Erreur:</strong> {storageState.localStorage.error}</p>
              )}
              <p><strong>Token présent:</strong> {storageState.localStorage?.token ? '✅ Oui' : '❌ Non'}</p>
              {storageState.localStorage?.token && (
                <>
                  <p><strong>Longueur:</strong> {storageState.localStorage.tokenLength} caractères</p>
                  <p className="text-xs break-all"><strong>Aperçu:</strong> {storageState.localStorage.token.substring(0, 50)}...</p>
                </>
              )}
            </div>
          </div>

          {/* sessionStorage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">sessionStorage</h2>
            <div className="space-y-2">
              <p><strong>Disponible:</strong> {storageState.sessionStorage?.available ? '✅ Oui' : '❌ Non'}</p>
              {storageState.sessionStorage?.error && (
                <p className="text-red-600"><strong>Erreur:</strong> {storageState.sessionStorage.error}</p>
              )}
              <p><strong>Token présent:</strong> {storageState.sessionStorage?.token ? '✅ Oui' : '❌ Non'}</p>
              {storageState.sessionStorage?.token && (
                <>
                  <p><strong>Longueur:</strong> {storageState.sessionStorage.tokenLength} caractères</p>
                  <p className="text-xs break-all"><strong>Aperçu:</strong> {storageState.sessionStorage.token.substring(0, 50)}...</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Button onClick={checkStorage} className="w-full">
            🔄 Rafraîchir
          </Button>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Navigation privée:</strong> Certains navigateurs en mode privé peuvent bloquer le stockage local.
              Si vous voyez des erreurs, essayez en mode normal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageDiagnostic;
