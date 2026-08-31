import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

const CreditPopupModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleShowPopup = (event) => {
      setMessage(event.detail || "Vous n'avez pas assez de crédits pour effectuer cette action.");
      setIsOpen(true);
    };

    window.addEventListener('show-credit-popup', handleShowPopup);
    return () => {
      window.removeEventListener('show-credit-popup', handleShowPopup);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-black text-[#082151] mb-4">Crédits Insuffisants</h2>
          <p className="text-slate-600 mb-8">{typeof message === 'string' ? message : JSON.stringify(message)}</p>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                setIsOpen(false);
                navigate(user?.role === 'freelancer' ? '/freelancer/credits' : '/employer/credits');
              }}
              className="w-full justify-center py-3.5 text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Recharger mon compte
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full justify-center py-3.5 text-lg border-slate-200 text-slate-600"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPopupModal;
