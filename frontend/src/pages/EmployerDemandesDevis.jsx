import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, CheckCircle2, XCircle, AlertCircle, MapPin, CalendarDays, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/PageLoader';
import Table from '../components/Table';
import Card from '../components/Card';
import Button from '../components/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const EmployerDemandesDevis = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  const parsePhotos = (photoData) => {
    if (!photoData) return []
    if (Array.isArray(photoData)) return photoData
    try {
      return JSON.parse(photoData)
    } catch {
      return [photoData]
    }
  }

  const getPhotoUrl = (photoObj) => {
    let finalUrl = photoObj;
    if (typeof finalUrl === 'object' && finalUrl !== null) {
      finalUrl = finalUrl.data || finalUrl.url || finalUrl.src || '';
    }
    if (typeof finalUrl !== 'string' || !finalUrl) return ''
    if (finalUrl.startsWith('http') || finalUrl.startsWith('data:')) return finalUrl
    const baseUrl = API_BASE_URL.replace('/api', '');
    return finalUrl.startsWith('/uploads') ? `${baseUrl}${finalUrl}` : `${baseUrl}/uploads/${finalUrl}`
  }

  useEffect(() => {
    document.title = 'Mes demandes de devis - Indebel';
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/devis/mes-demandes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDemandes((response.data?.data || response.data) || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast.error('Impossible de charger vos demandes de devis');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Projet',
      accessor: 'type_travaux',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.type_travaux}</div>
          <div className="text-xs text-slate-500">{row.categorie || 'Non catégorisé'}</div>
        </div>
      )
    },
    {
      header: 'Statut',
      accessor: 'statut',
      render: (row) => {
        let styles = 'bg-slate-100 text-slate-700';
        let icon = null;
        let text = row.statut;

        switch (row.statut) {
          case 'en_attente':
            styles = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
            text = 'En attente';
            break;
          case 'valide':
            styles = 'bg-blue-50 text-blue-700 border border-blue-200';
            icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
            text = 'Validé (Public)';
            break;
          case 'traite':
          case 'devis_complet':
            styles = 'bg-green-50 text-green-700 border border-green-200';
            icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
            text = 'Complet / Traité';
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
      header: 'Devis Reçus',
      accessor: 'total_devis_recus',
      render: (row) => (
        <span className="font-medium text-slate-700">
          {row.total_devis_recus || 0} devis
        </span>
      )
    },
    {
      header: 'Date',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-sm text-slate-500">
          {new Date(row.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {/* Note: In future we could add a page to view the received devis for this request */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedDemande(row)}
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Mes Demandes de Devis</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez vos demandes et consultez les devis reçus</p>
          </div>
        </div>
        <div className="relative z-10">
          <Button 
            onClick={() => navigate('/demande-devis')} 
            variant="white"
            className="rounded-full shadow-sm hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle demande
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      <Card>
        {demandes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune demande de devis</h3>
            <p className="text-slate-500 mb-6">Vous n'avez pas encore créé de demande de devis pour vos projets.</p>
            <Button onClick={() => navigate('/demande-devis')}>
              Créer ma première demande
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={demandes} />
          </div>
        )}
      </Card>

      {/* Modal Détails de la demande */}
      {selectedDemande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedDemande.type_travaux}</h3>
                  <p className="text-sm text-slate-500">{selectedDemande.categorie || 'Non catégorisé'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDemande(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Description du projet</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedDemande.description || selectedDemande.details_complementaires || 'Aucune description fournie.'}
                  </div>
                </div>

                {parsePhotos(selectedDemande.fichiers_joints || selectedDemande.photos || selectedDemande.images).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Photos du projet</h4>
                    <div className="flex flex-wrap gap-3">
                      {parsePhotos(selectedDemande.fichiers_joints || selectedDemande.photos || selectedDemande.images).map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="h-24 w-24 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2A4DEF] transition-all bg-slate-50"
                          onClick={() => setSelectedPhoto(getPhotoUrl(photo))}
                        >
                          <img src={getPhotoUrl(photo)} alt={`Photo ${idx+1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      Lieu des travaux
                    </div>
                    <p className="text-sm text-slate-600">{selectedDemande.adresse}</p>
                    <p className="text-sm text-slate-600">{selectedDemande.code_postal} {selectedDemande.ville}</p>
                    <p className="text-sm text-slate-500">{selectedDemande.region}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 font-medium mb-1">
                      <CalendarDays className="w-4 h-4 text-indigo-500" />
                      Détails de la demande
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Date souhaitée:</span> {selectedDemande.date_souhaite ? new Date(selectedDemande.date_souhaite).toLocaleDateString('fr-FR') : 'Non précisé'}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Urgence:</span> {selectedDemande.urgence}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Budget estimé:</span> {selectedDemande.budget_estime ? `${selectedDemande.budget_estime} €` : 'Non précisé'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={() => setSelectedDemande(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Photo Enlarge Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors" onClick={() => setSelectedPhoto(null)}>
            <X className="h-10 w-10" />
          </button>
          <img src={selectedPhoto} alt="Agrandissement" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default EmployerDemandesDevis;
