import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MessageSquare, Filter, Search, Clock, CheckCircle, AlertCircle, X, Send,
  BarChart3, Users, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import supportService from '../services/supportService';
import { useAuth } from '../context/AuthContext';

const AdminSupport = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  const [filters, setFilters] = useState({
    statut: '',
    priorite: '',
    categorie: '',
    search: ''
  });

  const categories = [
    { value: 'technique', label: 'Problème technique' },
    { value: 'paiement', label: 'Paiement' },
    { value: 'compte', label: 'Mon compte' },
    { value: 'mission', label: 'Mission' },
    { value: 'verification', label: 'Vérification' },
    { value: 'autre', label: 'Autre' }
  ];

  const priorites = [
    { value: 'basse', label: 'Basse', color: 'gray' },
    { value: 'normale', label: 'Normale', color: 'blue' },
    { value: 'haute', label: 'Haute', color: 'orange' },
    { value: 'urgente', label: 'Urgente', color: 'red' }
  ];

  const statuts = [
    { value: 'ouvert', label: 'Ouvert', icon: AlertCircle, color: 'yellow' },
    { value: 'en_cours', label: 'En cours', icon: Clock, color: 'blue' },
    { value: 'resolu', label: 'Résolu', icon: CheckCircle, color: 'green' },
    { value: 'ferme', label: 'Fermé', icon: X, color: 'gray' }
  ];

  useEffect(() => {
    // Ne charger que si l'utilisateur est connecté
    if (!user) return;
    loadTickets();
    loadStats();
  }, [filters, user]);

  useEffect(() => {
    // Ne charger que si l'utilisateur est connecté
    if (!user || !ticketId) return;
    loadTicketDetails(ticketId);
  }, [ticketId, user]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getAllTickets(filters);
      setTickets(data.data || []);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await supportService.getSupportStats();
      setStats(data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadTicketDetails = async (id) => {
    try {
      const data = await supportService.getTicketById(id);
      setSelectedTicket(data.data.ticket);
      setResponses(data.data.responses || []);
    } catch (error) {
      console.error('Erreur chargement ticket:', error);
      toast.error('Erreur lors du chargement du ticket');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();

    if (!replyMessage.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    try {
      setLoadingReply(true);
      await supportService.addResponse(selectedTicket.id, replyMessage);
      toast.success('Réponse envoyée');
      setReplyMessage('');
      loadTicketDetails(selectedTicket.id);
      loadTickets(); // Recharger la liste
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setLoadingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await supportService.updateTicketStatus(selectedTicket.id, newStatus);
      toast.success('Statut mis à jour');
      loadTicketDetails(selectedTicket.id);
      loadTickets();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutBadge = (statutValue) => {
    const statut = statuts.find(s => s.value === statutValue);
    if (!statut) return null;

    const Icon = statut.icon;
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[statut.color]}`}>
        <Icon className="w-4 h-4 mr-1" />
        {statut.label}
      </span>
    );
  };

  const getPrioriteBadge = (prioriteValue) => {
    const priorite = priorites.find(p => p.value === prioriteValue);
    if (!priorite) return null;

    const colors = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[priorite.color]}`}>
        {priorite.label}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        ticket.sujet.toLowerCase().includes(searchLower) ||
        ticket.message.toLowerCase().includes(searchLower) ||
        ticket.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && !tickets.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du Support</h1>
          <p className="text-gray-600">Gérez les tickets de support des utilisateurs</p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ouverts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.byStatus.find(s => s.statut === 'ouvert')?.count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.byStatus.find(s => s.statut === 'en_cours')?.count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Résolus</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.find(s => s.statut === 'resolu')?.count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {statuts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filters.priorite}
              onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les priorités</option>
              {priorites.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select
              value={filters.categorie}
              onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des tickets */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tickets ({filteredTickets.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun ticket trouvé</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/admin/support/${ticket.id}`)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-clamp-1">{ticket.sujet}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {ticket.denomination || `${ticket.prenom} ${ticket.nom}`}
                          </p>
                          <p className="text-xs text-gray-500">{ticket.email}</p>
                        </div>
                        {getPrioriteBadge(ticket.priorite)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.message}</p>
                      <div className="flex items-center justify-between">
                        {getStatutBadge(ticket.statut)}
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.date_creation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {ticket.nombre_reponses > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          {ticket.nombre_reponses} réponse{ticket.nombre_reponses > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Détails du ticket */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header du ticket */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.sujet}</h2>
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatutBadge(selectedTicket.statut)}
                        {getPrioriteBadge(selectedTicket.priorite)}
                        <span className="text-sm text-gray-500">
                          Ticket #{selectedTicket.id}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Utilisateur:</strong> {selectedTicket.denomination || `${selectedTicket.prenom} ${selectedTicket.nom}`}</p>
                        <p><strong>Email:</strong> {selectedTicket.email}</p>
                        <p><strong>Rôle:</strong> {selectedTicket.role}</p>
                        <p><strong>Catégorie:</strong> {categories.find(c => c.value === selectedTicket.categorie)?.label}</p>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex flex-col space-y-2">
                      {selectedTicket.statut !== 'en_cours' && (
                        <button
                          onClick={() => handleUpdateStatus('en_cours')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Prendre en charge
                        </button>
                      )}
                      {selectedTicket.statut !== 'resolu' && (
                        <button
                          onClick={() => handleUpdateStatus('resolu')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Marquer résolu
                        </button>
                      )}
                      {selectedTicket.statut !== 'ferme' && (
                        <button
                          onClick={() => handleUpdateStatus('ferme')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Fermer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                    <div className="mt-3 text-sm text-gray-500">
                      Créé le {new Date(selectedTicket.date_creation).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Réponses */}
                <div className="p-6 max-h-[400px] overflow-y-auto">
                  {responses.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Aucune réponse pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div
                          key={response.id}
                          className={`flex ${response.est_admin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${response.est_admin
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-100 border border-gray-200'
                              }`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`w-8 h-8 rounded-full ${response.est_admin ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-400'
                                } flex items-center justify-center text-white font-bold text-sm`}>
                                {response.est_admin ? 'A' : response.prenom?.[0] || 'U'}
                              </div>
                              <div className="ml-2">
                                <p className="font-medium text-sm text-gray-900">
                                  {response.est_admin ? 'Support Indebel' : `${response.prenom} ${response.nom}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(response.date_creation).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulaire de réponse */}
                {selectedTicket.statut !== 'ferme' && (
                  <form onSubmit={handleSendReply} className="p-6 border-t border-gray-200">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Répondre à l'utilisateur..."
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loadingReply || !replyMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center h-fit"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        {loadingReply ? 'Envoi...' : 'Répondre'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un ticket</h3>
                <p className="text-gray-600">Choisissez un ticket pour le traiter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
