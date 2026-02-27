import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Euro, Users, TrendingUp, RefreshCw } from 'lucide-react';
import factureService from '../services/factureService';
import toast from 'react-hot-toast';

export default function AdminFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingRetro, setGeneratingRetro] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('tous');

  useEffect(() => {
    chargerFactures();
  }, []);

  const chargerFactures = async () => {
    try {
      setLoading(true);
      const data = await factureService.getToutesFactures();
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

  const genererFacturesRetroactives = async () => {
    if (!window.confirm('Générer l\'historique pour tous les utilisateurs (y compris forfaits gratuits) ?')) {
      return;
    }

    try {
      setGeneratingRetro(true);
      const data = await factureService.genererFacturesRetroactives();

      if (data.success) {
        toast.success(`${data.facturesCreees} proformas générés`);
        chargerFactures();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setGeneratingRetro(false);
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
      annulee: 'bg-gray-100 text-gray-800',
      gratuit: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      payee: 'Payé',
      impayee: 'Impayé',
      annulee: 'Annulé',
      gratuit: 'Gratuit'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut]}`}>
        {labels[statut]}
      </span>
    );
  };

  const facturesFiltrees = filtreStatut === 'tous'
    ? factures
    : factures.filter(f => f.statut === filtreStatut);

  const stats = {
    total: factures.length,
    totalMontant: factures.reduce((sum, f) => sum + parseFloat(f.montant_ttc), 0),
    payees: factures.filter(f => f.statut === 'payee' || f.statut === 'gratuit').length,
    impayees: factures.filter(f => f.statut === 'impayee').length
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Proformas d'Abonnement
          </h1>
          <p className="mt-2 text-gray-600">
            Gestion des proformas de tous les utilisateurs
          </p>
        </div>
        <button
          onClick={genererFacturesRetroactives}
          disabled={generatingRetro}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {generatingRetro ? (
            <>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Générer l'historique rétroactif
            </>
          )}
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total proformas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMontant.toFixed(2)} €</p>
            </div>
            <Euro className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payées</p>
              <p className="text-2xl font-bold text-green-600">{stats.payees}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Impayées</p>
              <p className="text-2xl font-bold text-red-600">{stats.impayees}</p>
            </div>
            <Users className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltreStatut('tous')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filtreStatut === 'tous'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Toutes ({factures.length})
          </button>
          <button
            onClick={() => setFiltreStatut('payee')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filtreStatut === 'payee'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Payées ({stats.payees})
          </button>
          <button
            onClick={() => setFiltreStatut('impayee')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filtreStatut === 'impayee'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            Impayées ({stats.impayees})
          </button>
        </div>
      </div>

      {/* Liste des factures */}
      {facturesFiltrees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun proforma
          </h3>
          <p className="text-gray-600">
            {filtreStatut === 'tous'
              ? 'Aucun proforma généré pour le moment.'
              : `Aucun proforma avec le statut "${filtreStatut}".`}
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
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forfait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date souscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant TTC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturesFiltrees.map((facture) => (
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
                      <div className="text-sm font-medium text-gray-900">
                        {facture.user_prenom} {facture.user_nom}
                      </div>
                      <div className="text-sm text-gray-500">{facture.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{facture.forfait_nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formaterDate(facture.date_souscription)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <Euro size={14} className="mr-1" />
                        {parseFloat(facture.montant_ttc).toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {facture.date_expiration ? formaterDate(facture.date_expiration) : 'Illimité'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(facture.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => telecharger(facture.id, facture.numero_facture)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Download size={16} className="mr-1" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
