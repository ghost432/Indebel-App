import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle2, XCircle, AlertCircle, CalendarDays, User, HelpCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/PageLoader';
import Table from '../components/Table';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import ComparateurDevis from '../components/ComparateurDevis';
import CreditUnlockGuard from '../components/CreditUnlockGuard';

const EmployerDevisRecus = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showComparateur, setShowComparateur] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Devis reçus - Indebel';
    fetchDevisRecus();
  }, []);

  const fetchDevisRecus = async () => {
    try {
      const token = localStorage.getItem('token');
      // Nous utiliserons une nouvelle route backend pour récupérer les devis reçus par l'employeur
      const response = await axios.get(`${API_BASE_URL}/devis-soumis/recus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevis((response.data?.data || response.data) || []);
    } catch (error) {
      console.error('Erreur chargement devis reçus:', error);
      toast.error('Impossible de charger vos devis reçus');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, devis = selectedDevis) => {
    if (!devis) return;
    
    // Si c'est un refus, on peut demander confirmation
    if (action === 'refuser') {
      const confirm = window.confirm("Êtes-vous sûr de vouloir refuser ce devis ?");
      if (!confirm) return;
    }

    try {
      setActionLoading(true);
      await axios.post(`${API_BASE_URL}/devis-soumis/reponse-client`, {
        token: devis.token_action,
        action: action
      });
      
      toast.success(action === 'accepter' ? 'Devis accepté avec succès ! Le prestataire a été notifié.' : 'Devis refusé.');
      setSelectedDevis(null);
      if (showComparateur) setShowComparateur(false);
      fetchDevisRecus(); // Refresh the list
    } catch (error) {
      console.error('Erreur réponse devis:', error);
      toast.error(error.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setActionLoading(false);
    }
  };

  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(devis, 10);

  const columns = [
    {
      header: 'Projet',
      accessor: 'type_travaux',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.type_travaux || 'Projet non spécifié'}</div>
          <div className="text-xs text-slate-500">{row.categorie || 'Non catégorisé'}</div>
        </div>
      )
    },
    {
      header: 'Prestataire',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.freelancer_nom || 'Prestataire'}</div>
          <div className="text-xs text-slate-500">Reçu le {new Date(row.created_at).toLocaleDateString('fr-FR')}</div>
        </div>
      )
    },
    {
      header: 'Montant (TTC)',
      render: (row) => (
        <div className="font-medium text-slate-900">
          {Number(row.montant_ttc || row.montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
      )
    },
    {
      header: 'Statut',
      accessor: 'statut',
      render: (row) => {
        let styles = 'bg-slate-100 text-slate-700';
        let icon = null;
        let text = row.statut || 'En attente';

        switch (row.statut) {
          case 'en_attente':
            styles = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
            text = 'En attente';
            break;
          case 'accepte':
            styles = 'bg-green-50 text-green-700 border border-green-200';
            icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
            text = 'Accepté';
            break;
          case 'refuse':
            styles = 'bg-red-50 text-red-700 border border-red-200';
            icon = <XCircle className="w-3 h-3 mr-1" />;
            text = 'Refusé';
            break;
        }

        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles}`}>
            {icon}
            {text}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="bg-[#df6422] hover:bg-[#c85317] text-white font-bold whitespace-nowrap shadow-sm text-xs px-3 py-1.5"
            onClick={() => setSelectedDevis(row)}
          >
            👉 Cliquer ici pour accepter ou refuser
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <PageLoader />;

  return (
    <CreditUnlockGuard action="view_devis_recus" storageKey="unlocked_devis_recus" title="les devis reçus">
    <div>
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Devis Reçus</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Consultez les devis envoyés par les prestataires</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      <div className="mb-6 flex justify-end">
        <Button 
          onClick={() => setShowComparateur(true)}
          disabled={devis.length === 0}
          className="bg-[#082151] hover:bg-[#0d2f6f] text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Comparer les devis (Matrice)
        </Button>
      </div>

      <Card>
        {devis.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun devis reçu</h3>
            <p className="text-slate-500 mb-6">Vous n'avez pas encore reçu de devis pour vos demandes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={currentItems} />
            
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  itemsPerPage={10}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal Détails et Action Devis */}
      {selectedDevis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Proposition de devis</h3>
                  <p className="text-sm text-slate-500">Pour votre projet : {selectedDevis.type_travaux}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevis(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                disabled={actionLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
                      <User className="w-4 h-4 text-indigo-500" />
                      Prestataire
                    </div>
                    <p className="text-base font-bold text-slate-900">{selectedDevis.freelancer_nom || 'Prestataire'}</p>
                    <p className="text-sm text-slate-500">Date : {new Date(selectedDevis.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col justify-center">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Montant Total TTC</p>
                    <p className="text-3xl font-black text-[#c02525]">
                      {Number(selectedDevis.montant_ttc || selectedDevis.montant || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Description / Détails du devis</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedDevis.description || 'Aucune description détaillée n\'a été fournie.'}
                  </div>
                </div>
                
                {selectedDevis.delai_realisation && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Délai estimé :</span> {selectedDevis.delai_realisation}
                  </div>
                )}
                
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {(!selectedDevis.statut || selectedDevis.statut === 'en_attente') ? (
                <>
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleAction('refuser')}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    onClick={() => handleAction('accepter')}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Traitement...' : 'Accepter ce devis'}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 font-medium text-sm">
                  <HelpCircle className="w-4 h-4" />
                  Ce devis est déjà {selectedDevis.statut === 'accepte' ? 'accepté' : 'refusé'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ComparateurDevis 
        isOpen={showComparateur}
        onClose={() => setShowComparateur(false)}
        devisList={devis}
        onAction={(d, action) => handleAction(action, d)}
        actionLoading={actionLoading}
      />
    </div>
    </CreditUnlockGuard>
  );
};

export default EmployerDevisRecus;
