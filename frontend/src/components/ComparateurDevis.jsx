import React from 'react';
import { X, CheckCircle2, AlertCircle, CalendarDays, Euro, User } from 'lucide-react';
import Button from './Button';

const ComparateurDevis = ({ devisList, isOpen, onClose, onAction, actionLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-[#082151]">Matrice de décision : Comparateur de Devis</h3>
            <p className="text-sm text-slate-500">Comparez vos devis côte à côte pour prendre la meilleure décision.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/50">
          {devisList.length === 0 ? (
            <p className="text-center text-slate-500 my-10">Aucun devis à comparer.</p>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b-2 border-slate-200 bg-slate-100 w-1/4">Critères</th>
                  {devisList.map((d, i) => (
                    <th key={d.id || i} className="p-4 border-b-2 border-slate-200 bg-white min-w-[250px] shadow-sm rounded-t-xl mx-2">
                      <div className="flex items-center gap-2 text-[#082151] text-lg font-black">
                        <User className="w-5 h-5 text-[#df6422]" />
                        {d.freelancer_nom || 'Prestataire'}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50"><Euro className="w-4 h-4 inline mr-2"/> Montant Total TTC</td>
                  {devisList.map((d, i) => (
                    <td key={d.id || i} className="p-4 border-b border-slate-100 bg-white">
                      <span className="text-xl font-black text-[#c02525]">
                        {Number(d.montant_ttc || d.montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50"><CalendarDays className="w-4 h-4 inline mr-2"/> Délai estimé</td>
                  {devisList.map((d, i) => (
                    <td key={d.id || i} className="p-4 border-b border-slate-100 bg-white font-medium text-slate-600">
                      {d.delai_realisation || 'Non spécifié'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50 align-top">Description</td>
                  {devisList.map((d, i) => (
                    <td key={d.id || i} className="p-4 border-b border-slate-100 bg-white align-top">
                      <p className="text-xs text-slate-500 whitespace-pre-wrap line-clamp-6" title={d.description}>
                        {d.description || 'Aucune description fournie.'}
                      </p>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50 rounded-bl-xl">Action</td>
                  {devisList.map((d, i) => (
                    <td key={d.id || i} className="p-4 bg-white text-center">
                      {(!d.statut || d.statut === 'en_attente') ? (
                        <Button 
                          className="w-full bg-[#082151] hover:bg-[#0d2f6f] text-white"
                          onClick={() => onAction(d, 'accepter')}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Choisir ce devis
                        </Button>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          d.statut === 'accepte' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {d.statut === 'accepte' ? 'Accepté' : 'Refusé'}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparateurDevis;
