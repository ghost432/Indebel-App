import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, History, Plus, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const PACKS = [
  { id: 10, amount: 10, title: 'Pack Débutant', popular: false },
  { id: 50, amount: 50, title: 'Pack Pro', popular: true },
  { id: 100, amount: 100, title: 'Pack Expert', popular: false }
];

const FreelancerPortefeuille = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [creditPrice, setCreditPrice] = useState(1);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    document.title = 'Mon Portefeuille - Indebel';
    
    if (searchParams.get('success')) {
      toast.success('Paiement réussi ! Vos crédits ont été ajoutés.');
      searchParams.delete('success');
      setSearchParams(searchParams);
    }
    if (searchParams.get('canceled')) {
      toast.error('Le paiement a été annulé.');
      searchParams.delete('canceled');
      setSearchParams(searchParams);
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, historyRes, priceRes] = await Promise.all([
        api.get('/credits/balance'),
        api.get('/credits/historique'),
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: { price: 1 } }))
      ]);
      
      setBalance(balanceRes.data.solde || 0);
      setHistory(historyRes.data.historique || []);
      setCreditPrice(priceRes.data.price || 1);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const buyPack = async (amount) => {
    try {
      setProcessingId(amount);
      const response = await api.post('/credits/buy', { pack_amount: amount });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Erreur lors de la redirection vers le paiement');
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <PageLoader fullScreen />;

  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Mon Portefeuille</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez vos crédits pour interagir avec les clients</p>
        </div>
        <div className="relative z-10 bg-white/10 rounded-2xl p-4 flex items-center gap-4 border border-white/20 backdrop-blur-sm">
          <div className="p-3 bg-white/20 rounded-xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-white/80 text-sm font-medium">Solde actuel</div>
            <div className="text-3xl font-black text-white">{balance} <span className="text-lg font-semibold">Crédits</span></div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#082151] mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary-600" />
          Recharger mon compte
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map(pack => (
            <div key={pack.id} className={`relative rounded-3xl p-6 sm:p-8 flex flex-col ${pack.popular ? 'bg-gradient-to-br from-[#082151] to-[#1a3a7a] text-white shadow-xl scale-105 z-10 border-0' : 'bg-white text-slate-800 border border-slate-200 shadow-md'}`}>
              {pack.popular && (
                <div className="absolute -top-3 inset-x-0 mx-auto w-max px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md">
                  LE PLUS POPULAIRE
                </div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${pack.popular ? 'text-white' : 'text-[#082151]'}`}>{pack.title}</h3>
              <div className="text-4xl font-black mb-1">
                {pack.amount} <span className={`text-lg ${pack.popular ? 'text-white/80' : 'text-slate-500'}`}>crédits</span>
              </div>
              <div className={`font-semibold mb-6 ${pack.popular ? 'text-white/80' : 'text-slate-500'}`}>
                Pour {(pack.amount * creditPrice).toFixed(2)} €
              </div>
              
              <ul className={`space-y-3 mb-8 flex-1 text-sm ${pack.popular ? 'text-white/90' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2">
                  <Check className={`w-4 h-4 mt-0.5 ${pack.popular ? 'text-amber-400' : 'text-primary-600'}`} />
                  Crédits valables à vie
                </li>
                <li className="flex items-start gap-2">
                  <Check className={`w-4 h-4 mt-0.5 ${pack.popular ? 'text-amber-400' : 'text-primary-600'}`} />
                  Accès aux coordonnées clients
                </li>
              </ul>
              
              <Button 
                onClick={() => buyPack(pack.amount)} 
                disabled={processingId === pack.amount}
                className={`w-full justify-center py-3 text-base ${pack.popular ? 'bg-amber-500 hover:bg-amber-600 text-white border-0' : 'bg-[#082151] hover:bg-[#1a3a7a]'}`}
              >
                {processingId === pack.amount ? 'Redirection...' : 'Acheter maintenant'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#082151] mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600" />
          Historique des transactions
        </h2>
        
        <Card className="p-0 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aucune transaction dans votre historique.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Description</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(tx.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                          ${tx.type === 'achat' || tx.type === 'bonus' ? 'bg-green-100 text-green-700' : 
                            tx.type === 'depense' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}
                        `}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{tx.description}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${
                        tx.type === 'achat' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'achat' || tx.type === 'bonus' ? '+' : '-'}{tx.montant}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FreelancerPortefeuille;
