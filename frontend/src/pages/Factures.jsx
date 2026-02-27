import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Euro, CheckCircle, Clock } from 'lucide-react';
import factureService from '../services/factureService';
import toast from 'react-hot-toast';

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    try {
      setLoading(true);
      const data = await factureService.getMesFactures();
      if (data.success) {
        setFactures(data.factures);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const telecharger = async (factureId, numeroFacture) => {
    try {
      await factureService.telechargerFacture(factureId);
      toast.success(`Proforma ${numeroFacture} téléchargé`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const formaterDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatutBadge = (statut) => {
    const styles = {
      payee: 'bg-green-100 text-green-800',
      impayee: 'bg-red-100 text-red-800',
      annulee: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      payee: 'Payée',
      impayee: 'Impayée',
      annulee: 'Annulée'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          Mes Proformas d'Abonnement
        </h1>
        <p className="mt-2 text-gray-600">
          Consultez et téléchargez vos proformas d'abonnement
        </p>
      </div>

      {/* Liste des factures */}
      {factures.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun proforma
          </h3>
          <p className="text-gray-600">
            Vous n'avez pas encore de proformas. Ils apparaîtront ici après la souscription à un forfait.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forfait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {factures.map((facture) => (
                  <tr key={facture.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">
                          {facture.numero_facture}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{facture.forfait_nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formaterDate(facture.date_creation)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formaterDate(facture.date_souscription)}
                        {facture.date_expiration && (
                          <> → {formaterDate(facture.date_expiration)}</>
                        )}
                        {!facture.date_expiration && <> → Illimité</>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <Euro size={14} className="mr-1" />
                        {parseFloat(facture.montant_ttc).toFixed(2)} €
                      </div>
                      <div className="text-xs text-gray-500">
                        HT: {parseFloat(facture.montant_ht).toFixed(2)} € + TVA: {parseFloat(facture.montant_tva).toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(facture.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => telecharger(facture.id, facture.numero_facture)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download size={16} className="mr-1" />
                        Télécharger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Résumé */}
      {factures.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-blue-600 font-medium">Total proformas</div>
              <div className="text-2xl font-bold text-blue-900">{factures.length}</div>
            </div>
            <div>
              <div className="text-sm text-blue-600 font-medium">Total payé</div>
              <div className="text-2xl font-bold text-blue-900">
                {factures
                  .filter(f => f.statut === 'payee' || f.statut === 'gratuit')
                  .reduce((sum, f) => sum + parseFloat(f.montant_ttc), 0)
                  .toFixed(2)} €
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-600 font-medium">Dernier proforma</div>
              <div className="text-2xl font-bold text-blue-900">
                {formaterDate(factures[0].date_creation)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
