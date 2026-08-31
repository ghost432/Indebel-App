import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Users, Plus, Minus, Search, Settings, Briefcase, UserRound, TrendingUp, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import { userService } from '../services/userService';

const AdminCredits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingPrice, setSavingPrice] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('general'); // Tab state for costs configuration
  const [manageModal, setManageModal] = useState({ open: false, user: null, action: 'add', amount: 10, reason: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Settings State
  const [settings, setSettings] = useState({
    price: 1,
    cout_devis_manuel: 1,
    cout_devis_ia: 2,
    cout_documents_freelancer: 1,
    cout_candidatures_ia: 1,
    cout_vues_missions: 1,
    cout_vues_devis: 1,
    cout_postulations: 1,
    cout_vues_employers: 1,
    cout_missions_employer: 1,
    cout_documents_employer: 1,
    cout_demandes_devis: 1,
    cout_devis_recus: 1,
    cout_candidatures_recues: 1,
    cout_vues_freelancers: 1
  });

  // Mass free credits distribution state
  const [massCredits, setMassCredits] = useState({ amount: 5, updateDefault: true, sending: false });
  const [showMassConfirm, setShowMassConfirm] = useState(false);

  const handleGiveMassCredits = async () => {
    try {
      setMassCredits(prev => ({ ...prev, sending: true }));
      const res = await api.post('/admin-credits/give-free-credits-all', {
        amount: parseInt(massCredits.amount, 10),
        updateDefault: massCredits.updateDefault
      });
      toast.success(res.data.message || 'Crédits gratuits attribués avec succès !');
      setShowMassConfirm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'attribution des crédits');
    } finally {
      setMassCredits(prev => ({ ...prev, sending: false }));
    }
  };

  useEffect(() => {
    document.title = 'Gestion des Crédits - Admin - Indebel';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [priceRes, usersRes] = await Promise.all([
        api.get('/admin-credits/settings/price'),
        userService.getAllUsers()
      ]);
      
      setSettings(prev => ({
        ...prev,
        ...priceRes.data
      }));
      
      const usersData = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
      setUsers(usersData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingPrice(true);
      const payload = { ...settings };
      // Parse numbers
      Object.keys(payload).forEach(k => {
        payload[k] = k === 'price' ? parseFloat(payload[k]) : parseInt(payload[k], 10);
      });

      await api.post('/admin-credits/settings/price', payload);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des paramètres');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin-credits/users/balance', {
        userId: manageModal.user.id,
        action: manageModal.action,
        amount: parseInt(manageModal.amount),
        reason: manageModal.reason
      });
      
      toast.success('Solde mis à jour avec succès');
      setManageModal({ open: false, user: null, action: 'add', amount: 10, reason: '' });
      fetchData(); // refresh users list
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du solde');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.nom && u.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.prenom && u.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.denomination && u.denomination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Statistics calculation for the 3rd card
  const totalCreditsCirculation = users.reduce((acc, u) => acc + (parseInt(u.solde_credits, 10) || 0), 0);
  const usersWithCreditsCount = users.filter(u => (parseInt(u.solde_credits, 10) || 0) > 0).length;
  const avgCreditsPerUser = users.length > 0 ? (totalCreditsCirculation / users.length).toFixed(1) : 0;

  if (loading) return <PageLoader fullScreen />;

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gestion des Crédits & Actions</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Définissez le coût des actions et gérez le solde des utilisateurs</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Top Section: 3 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Configuration des coûts */}
        <Card className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-50 rounded-xl">
                <Settings className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-[#082151]">Configuration des coûts</h2>
            </div>

            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'general' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Général
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('freelancer')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'freelancer' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Prestataire
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employer')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'employer' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Recruteur
              </button>
            </div>

            <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-4">
              {activeTab === 'general' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix de 1 crédit (en €)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-8 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        value={settings.price}
                        onChange={(e) => handleSettingsChange('price', e.target.value)}
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Prix unitaire en Euros (hors TVA) pour l'achat de packs de crédits.</p>
                  </div>

                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Crédits gratuits offerts à l'inscription" 
                      value={settings.credits_gratuits_inscription || 5} 
                      onChange={(e) => handleSettingsChange('credits_gratuits_inscription', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Nombre de crédits offerts automatiquement à chaque nouvel utilisateur lors de la création de son compte.</p>
                  </div>
                </div>
              )}

              {activeTab === 'freelancer' && (
                <div className="space-y-4 animate-fadeIn max-h-[380px] overflow-y-auto pr-1">
                  <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-800 border border-blue-100 font-medium">
                    <strong>Actions Prestataire :</strong> Coût en crédits appliqué lors de l'exécution de chaque action.
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Rédiger / Générer un Devis Manuel" 
                      value={settings.cout_devis_manuel} 
                      onChange={(e) => handleSettingsChange('cout_devis_manuel', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités lors de la création d'un devis manuellement par le prestataire.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Générer un Devis via l'IA" 
                      value={settings.cout_devis_ia} 
                      onChange={(e) => handleSettingsChange('cout_devis_ia', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités lors de la rédaction d'un devis avec l'assistant IA.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Postuler / Candidater à une mission" 
                      value={settings.cout_postulations} 
                      onChange={(e) => handleSettingsChange('cout_postulations', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités chaque fois qu'un prestataire postule à une mission.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Candidater avec l'assistant IA" 
                      value={settings.cout_candidatures_ia} 
                      onChange={(e) => handleSettingsChange('cout_candidatures_ia', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités lors de la génération d'une lettre de candidature IA.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter les coordonnées d'un Devis (Vue Devis)" 
                      value={settings.cout_vues_devis} 
                      onChange={(e) => handleSettingsChange('cout_vues_devis', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits requis pour afficher les infos et coordonnées d'une demande de devis.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter les détails d'une Mission (Vue Mission)" 
                      value={settings.cout_vues_missions} 
                      onChange={(e) => handleSettingsChange('cout_vues_missions', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits requis pour consulter une offre de mission.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter la liste / annuaire des Recruteurs" 
                      value={settings.cout_vues_employers} 
                      onChange={(e) => handleSettingsChange('cout_vues_employers', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits requis pour consulter l'annuaire des entreprises / recruteurs.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Télécharger / Exporter un document" 
                      value={settings.cout_documents_freelancer} 
                      onChange={(e) => handleSettingsChange('cout_documents_freelancer', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités par document ou facture exportée.</p>
                  </div>
                </div>
              )}

              {activeTab === 'employer' && (
                <div className="space-y-4 animate-fadeIn max-h-[380px] overflow-y-auto pr-1">
                  <div className="p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-800 border border-indigo-100 font-medium">
                    <strong>Actions Recruteur :</strong> Coût en crédits débiter au recruteur pour la publication et consultation.
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Publier une Demande de Devis" 
                      value={settings.cout_demandes_devis} 
                      onChange={(e) => handleSettingsChange('cout_demandes_devis', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités lors de la publication d'une nouvelle demande de devis.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Publier une Offre de Mission" 
                      value={settings.cout_missions_employer} 
                      onChange={(e) => handleSettingsChange('cout_missions_employer', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités lors de la publication d'une offre de mission.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter la liste / annuaire des Prestataires" 
                      value={settings.cout_vues_freelancers} 
                      onChange={(e) => handleSettingsChange('cout_vues_freelancers', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits requis pour consulter l'annuaire des prestataires.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter / Débloquer un devis reçu" 
                      value={settings.cout_devis_recus} 
                      onChange={(e) => handleSettingsChange('cout_devis_recus', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits pour accéder aux coordonnées d'un prestataire ayant répondu à un devis.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Consulter / Débloquer une candidature reçue" 
                      value={settings.cout_candidatures_recues} 
                      onChange={(e) => handleSettingsChange('cout_candidatures_recues', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits pour accéder aux coordonnées d'un candidat à une mission.</p>
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      label="Télécharger / Exporter un document" 
                      value={settings.cout_documents_employer} 
                      onChange={(e) => handleSettingsChange('cout_documents_employer', e.target.value)} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Crédits débités par document téléchargé.</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6">
            <Button type="submit" form="settings-form" disabled={savingPrice} className="w-full justify-center">
              {savingPrice ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </Card>

        {/* Card 2: Distribution de Crédits Gratuits à Tous */}
        <Card className="h-full flex flex-col justify-between bg-gradient-to-br from-amber-50/70 via-white to-orange-50/70 border-amber-200/80">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-700 font-black text-xl">
                🎁
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Offrir des Crédits Gratuits</h2>
                <p className="text-xs text-slate-500">Distribuer des crédits à tous les utilisateurs enregistrés</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Nombre de crédits offerts par utilisateur"
                  type="number"
                  min="1"
                  value={massCredits.amount}
                  onChange={(e) => setMassCredits(prev => ({ ...prev, amount: e.target.value }))}
                />
                <p className="text-[11px] text-slate-500 mt-1">Chaque prestataire et recruteur recevra immédiatement cette quantité de crédits.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="updateDefaultCheck"
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  checked={massCredits.updateDefault}
                  onChange={(e) => setMassCredits(prev => ({ ...prev, updateDefault: e.target.checked }))}
                />
                <label htmlFor="updateDefaultCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Définir aussi ce montant comme offre par défaut à l'inscription
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-100 mt-6">
            <Button
              onClick={() => setShowMassConfirm(true)}
              className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
            >
              🎁 Offrir {massCredits.amount || 0} crédits à TOUS ({users.length} util.)
            </Button>
          </div>
        </Card>

        {/* Card 3: Aperçu & Statistiques Générales des Crédits */}
        <Card className="h-full flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#082151] to-slate-900 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 text-amber-400 rounded-xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Économie des Crédits</h2>
                <p className="text-xs text-slate-300">Vue d'ensemble et métriques globales</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-1">
                  <Coins className="w-4 h-4 text-amber-400" /> Crédits en circulation
                </div>
                <div className="text-2xl font-black text-white">{totalCreditsCirculation}</div>
                <span className="text-[10px] text-slate-400">Total distribué/détenu</span>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-1">
                  <Users className="w-4 h-4 text-blue-400" /> Comptes Approvisionnés
                </div>
                <div className="text-2xl font-black text-white">{usersWithCreditsCount} <span className="text-xs font-normal text-slate-400">/ {users.length}</span></div>
                <span className="text-[10px] text-slate-400">Solde &gt; 0 crédit</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-300 font-medium">Prix unitaire du crédit :</span>
                <span className="font-bold text-amber-400">{settings.price} € HT</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-300 font-medium">Moyenne par utilisateur :</span>
                <span className="font-bold text-white">{avgCreditsPerUser} cr.</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-300 font-medium">Crédits offre inscription :</span>
                <span className="font-bold text-emerald-400">{settings.credits_gratuits_inscription || 5} cr.</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 mt-6 flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Système d'économie & monétisation actif</span>
          </div>

          <div className="absolute right-0 bottom-0 w-48 h-48 bg-gradient-to-tl from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-2xl pointer-events-none"></div>
        </Card>
      </div>

      {/* Bottom Section: Full Width User Balance Card */}
      <Card className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#082151]">Soldes des utilisateurs</h2>
              <p className="text-xs text-slate-500">Ajustez manuellement les soldes de crédits pour chaque utilisateur</p>
            </div>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pl-9 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset pagination on search
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-semibold text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4 text-center">Solde actuel</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{u.denomination || `${u.prenom || ''} ${u.nom || ''}`}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                      u.role === 'freelancer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role === 'freelancer' ? <Briefcase className="w-3.5 h-3.5" /> : <UserRound className="w-3.5 h-3.5" />}
                      {u.role === 'freelancer' ? 'Prestataire' : 'Recruteur'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-black text-lg text-[#082151] bg-slate-100 px-3 py-1 rounded-xl">{u.solde_credits || 0}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setManageModal({ open: true, user: u, action: 'add', amount: 10, reason: 'Geste commercial' })}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-xs flex items-center gap-1"
                        title="Ajouter des crédits"
                      >
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                      <button
                        onClick={() => setManageModal({ open: true, user: u, action: 'remove', amount: 10, reason: 'Correction' })}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs flex items-center gap-1"
                        title="Retirer des crédits"
                      >
                        <Minus className="w-4 h-4" /> Retirer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="py-8 text-center text-slate-500">Aucun utilisateur trouvé</div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 mt-4">
              <div className="text-sm text-slate-500">
                Affichage de <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> sur <span className="font-semibold text-slate-900">{filteredUsers.length}</span> résultats
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {manageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
            <div className={`px-6 py-4 border-b ${manageModal.action === 'add' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <h3 className={`text-lg font-bold ${manageModal.action === 'add' ? 'text-green-800' : 'text-red-800'}`}>
                {manageModal.action === 'add' ? 'Ajouter des crédits' : 'Retirer des crédits'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Pour <strong>{manageModal.user.denomination || `${manageModal.user.prenom} ${manageModal.user.nom}`}</strong> (Solde actuel: <span className="font-bold text-slate-900">{manageModal.user.solde_credits || 0}</span>)
              </p>
            </div>
            
            <form onSubmit={handleUpdateBalance} className="p-6 space-y-4">
              <Input
                label="Nombre de crédits"
                type="number"
                min="1"
                required
                value={manageModal.amount}
                onChange={(e) => setManageModal({ ...manageModal, amount: e.target.value })}
              />
              <Input
                label="Motif (visible dans l'historique)"
                required
                value={manageModal.reason}
                onChange={(e) => setManageModal({ ...manageModal, reason: e.target.value })}
                placeholder="Ex: Geste commercial, Erreur système..."
              />
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" className="flex-1 justify-center" onClick={() => setManageModal({ open: false, user: null })}>
                  Annuler
                </Button>
                <Button type="submit" className={`flex-1 justify-center ${manageModal.action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirmer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal pour Crédits Massifs */}
      {showMassConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <span>🎁</span> Confirmer la distribution de crédits
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                Vous allez offrir <strong>{massCredits.amount} crédits gratuits</strong> à <strong>{users.length} utilisateurs</strong> enregistrés.
              </p>
              
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
                <p>• Une notification In-App sera envoyée à chaque utilisateur.</p>
                <p>• Un email d'information leur sera automatiquement transmis.</p>
                {massCredits.updateDefault && (
                  <p className="font-semibold text-amber-800">• Le montant par défaut à l'inscription sera mis à jour à <strong>{massCredits.amount} crédits</strong>.</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 justify-center" 
                  disabled={massCredits.sending}
                  onClick={() => setShowMassConfirm(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  onClick={handleGiveMassCredits}
                  disabled={massCredits.sending}
                  className="flex-1 justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {massCredits.sending ? 'Attribution...' : 'Oui, Distribuer !'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCredits;
