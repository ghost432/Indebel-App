import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Check, X, Trash2, ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import devisService from '../services/devisService';

const AdminDemandeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentaire, setCommentaire] = useState('');
    const [actionModal, setActionModal] = useState({ open: false, type: '' });

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await devisService.getDemandeById(id);
            if (response.success) {
                setDemande(response.data);
            }
        } catch (error) {
            toast.error('Erreur chargement détails');
            navigate('/admin/devis');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            if (actionModal.type === 'valider') {
                await devisService.validerDemande(id, commentaire);
                toast.success('Demande validée');
            } else if (actionModal.type === 'refuser') {
                await devisService.refuserDemande(id, commentaire);
                toast.success('Demande refusée');
            }
            setActionModal({ open: false, type: '' });
            fetchDetails(); // Refresh
        } catch (error) {
            toast.error('Erreur lors de l\'action');
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!demande) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <Button variant="ghost" onClick={() => navigate('/admin/devis')} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{demande.type_travaux}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>Ref: #{demande.id}</span>
                                <span>Créé le {new Date(demande.created_at).toLocaleDateString()}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                   ${demande.statut === 'valide' ? 'bg-green-100 text-green-800' :
                                        demande.statut === 'refuse' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {demande.statut.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {demande.statut === 'en_attente' && (
                                <>
                                    <Button onClick={() => setActionModal({ open: true, type: 'valider' })} className="bg-green-600 hover:bg-green-700">
                                        <Check className="h-4 w-4 mr-2" /> Valider
                                    </Button>
                                    <Button variant="outline" onClick={() => setActionModal({ open: true, type: 'refuser' })} className="text-red-600 border-red-200 hover:bg-red-50">
                                        <X className="h-4 w-4 mr-2" /> Refuser
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        {/* Main Content */}
                        <div className="md:col-span-2 p-6 border-r border-gray-100">
                            <h3 className="font-semibold text-lg mb-4">Description</h3>
                            <div className="prose bg-gray-50 p-4 rounded-lg mb-6">
                                {demande.description}
                            </div>

                            <h3 className="font-semibold text-lg mb-4">Détails techniques</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Catégorie</label>
                                    <p className="font-medium">{demande.categorie}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Date de début souhaitée</label>
                                    <p className="font-medium">{demande.date_souhaite}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Urgence</label>
                                    <p className="font-medium text-orange-600">{demande.urgence || 'Normale'}</p>
                                </div>
                            </div>

                            {(() => {
                                let fichiers = [];
                                try {
                                    const raw = demande.fichiers_joints;
                                    if (Array.isArray(raw)) fichiers = raw;
                                    else if (typeof raw === 'string') fichiers = JSON.parse(raw);
                                } catch (e) { fichiers = []; }

                                return fichiers.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Fichiers ({fichiers.length})</h3>
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {fichiers.map((f, i) => (
                                                <div key={i} className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border text-xs overflow-hidden">
                                                    {(f.data && (f.data.startsWith('data:image') || f.data.match(/\.(jpeg|jpg|gif|png|webp)$/i))) ? (
                                                        <img src={f.data} alt={f.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <div>📄</div>
                                                            <div className="truncate w-full">{f.name || `Fichier ${i + 1}`}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Sidebar Client Info */}
                        <div className="p-6 bg-gray-50">
                            <h3 className="font-semibold text-lg mb-4">Client</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                        {demande.prenom?.[0]}{demande.nom?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{demande.prenom} {demande.nom}</p>
                                        <p className="text-xs text-gray-500">Particulier</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 space-y-3 font-medium text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> {demande.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> {demande.telephone}
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-0.5" />
                                        <span>{demande.adresse}<br />{demande.code_postal} {demande.ville}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {actionModal.type === 'valider' ? 'Valider la demande' : 'Refuser la demande'}
                        </h3>
                        <textarea
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                            placeholder="Ajouter un commentaire (optionnel)..."
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setActionModal({ open: false, type: '' })}>Annuler</Button>
                            <Button onClick={handleAction}>Confirmer</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDemandeDetails;
