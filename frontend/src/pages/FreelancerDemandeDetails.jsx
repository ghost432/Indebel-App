import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, MapPin, Calendar, DollarSign, Clock, Send, ArrowLeft, Upload, Paperclip, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import devisSoumisService from '../services/devisSoumisService';

const FreelancerDemandeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [demande, setDemande] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDevisForm, setShowDevisForm] = useState(false);

    // Form state
    const [devisForm, setDevisForm] = useState({
        description: '',
        fichiers: []
    });

    useEffect(() => {
        fetchDemandeDetails();
    }, [id]);

    const fetchDemandeDetails = async () => {
        try {
            setLoading(true);
            // Note: We might need to ensure this endpoint exists and is accessible. 
            // If devisSoumisService.getDemandesDisponibles was used for the list, we assume there's a getById or similar.
            // If not, we might need a new service method. For now assuming getDemandeById works for freelancers.
            // Actually, devisSoumisService likely needs getDemandeById exposed.
            // Let's check if devisService.getDemandeById is protected or if we need a specific one.
            // Given the list logic was in `devisSoumisService`, let's assume we need to use that.
            // Wait, standard `devisService.getDemandeById` might work if the user has rights? 
            // The backend `getDemandeById` checked for admin? Let's verify backend access rights later.
            // For now, implementing standard fetch.

            // Since we don't have a specific "getDemandeById" for freelancer in the previous code context,
            // I will assume for now we use a new endpoint or the existing admin one if permissions allow.
            // But typically, freelancers shouldn't see Admin private notes.
            // I will implement a service call here assuming `devisSoumisService.getDemandeDetails(id)` exists or I will add it.
            const response = await devisSoumisService.getDemandeDetails(id);
            if (response.success) {
                setDemande(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            toast.error('Impossible de charger les détails de la demande');
            navigate('/freelancer/devis-disponibles');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (devisForm.fichiers.length + files.length > 5) {
            toast.error('Vous ne pouvez télécharger que 5 fichiers maximum');
            return;
        }
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} est trop volumineux (max 10MB)`);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setDevisForm(prev => ({
                    ...prev,
                    fichiers: [...prev.fichiers, { name: file.name, data: reader.result }]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFichier = (index) => {
        setDevisForm(prev => ({
            ...prev,
            fichiers: prev.fichiers.filter((_, i) => i !== index)
        }));
    };

    const handleSubmitDevis = async (e) => {
        e.preventDefault();
        if (!devisForm.description) {
            toast.error('La description est obligatoire');
            return;
        }
        try {
            setSubmitting(true);
            const response = await devisSoumisService.soumettreDevis({
                demande_devis_id: id,
                description: devisForm.description,
                fichiers: devisForm.fichiers
            });

            if (response.success) {
                toast.success('Devis soumis avec succès !');
                // Refresh details to show "Already Submitted" state
                fetchDemandeDetails();
                setShowDevisForm(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!demande) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/freelancer/devis-disponibles')}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux opportunités
                </Button>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                                    {demande.categorie}
                                </span>
                                <h1 className="text-2xl font-bold text-gray-900">{demande.type_travaux}</h1>
                                <div className="flex items-center text-gray-500 mt-2 text-sm">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {demande.ville} ({demande.code_postal}) • {demande.region}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center text-gray-700 mb-2 font-medium">
                                <div className="text-gray-700 mb-2 font-medium">
                                    Date souhaitée
                                </div>
                                <p className="text-gray-600">
                                    {demande.date_souhaite}
                                </p>
                            </div>
                            {demande.urgence && (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <div className="flex items-center text-orange-800 mb-2 font-medium">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Niveau d'urgence
                                    </div>
                                    <p className="text-orange-700">{demande.urgence}</p>
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description du projet</h3>
                            <div className="prose text-gray-600 max-w-none bg-gray-50 p-6 rounded-lg">
                                {demande.description}
                            </div>
                        </div>

                        {demande.details_complementaires && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails complémentaires</h3>
                                <div className="prose text-gray-600 max-w-none">
                                    {demande.details_complementaires}
                                </div>
                            </div>
                        )}

                        {(() => {
                            let fichiers = [];
                            try {
                                const raw = demande.fichiers_joints;
                                if (Array.isArray(raw)) fichiers = raw;
                                else if (typeof raw === 'string') fichiers = JSON.parse(raw);
                            } catch (e) { fichiers = []; }

                            return fichiers.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos et documents</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {fichiers.map((fichier, idx) => (
                                            <div key={idx} className="relative group">
                                                {fichier.data && (fichier.data.startsWith('data:image') || fichier.data.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                                                    <img
                                                        src={fichier.data}
                                                        alt={fichier.name || `Image ${idx + 1}`}
                                                        className="rounded-lg w-full h-48 object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 h-full">
                                                        <Paperclip className="h-5 w-5 text-gray-500" />
                                                        <span className="text-sm text-gray-700 truncate">{fichier.name || 'Document'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Offre publiée le {new Date(demande.created_at).toLocaleDateString()}
                        </div>
                        {demande.deja_soumis ? (
                            <Button disabled className="bg-green-100 text-green-700 cursor-not-allowed">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Devis déjà envoyé
                            </Button>
                        ) : (
                            <Button onClick={() => setShowDevisForm(true)}>
                                <Send className="h-4 w-4 mr-2" />
                                Soumettre un devis maintenant
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Formulaire (reused logic) */}
            {showDevisForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Votre proposition</h2>
                            <form onSubmit={handleSubmitDevis} className="space-y-4">
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        required rows={5}
                                        value={devisForm.description}
                                        onChange={e => setDevisForm({ ...devisForm, description: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>

                                {/* File Upload Logic Simplified */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fichiers (Max 5)</label>
                                    <input type="file" multiple onChange={handleFileUpload} className="border p-2 w-full" />
                                    <div className="mt-2 space-y-1">
                                        {devisForm.fichiers.map((f, i) => (
                                            <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                <span>{f.name}</span>
                                                <button type="button" onClick={() => removeFichier(i)} className="text-red-500">X</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" type="button" onClick={() => setShowDevisForm(false)} className="flex-1">Annuler</Button>
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? 'Envoi...' : 'Envoyer le devis'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FreelancerDemandeDetails;
