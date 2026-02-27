import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import supportService from '../services/supportService';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  const [newTicket, setNewTicket] = useState({
    sujet: '',
    categorie: 'autre',
    priorite: 'normale',
    message: ''
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
  }, [user]);

  useEffect(() => {
    // Ne charger que si l'utilisateur est connecté
    if (!user || !ticketId) return;
    loadTicketDetails(ticketId);
  }, [ticketId, user]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getUserTickets();
      setTickets(data.data || []);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
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

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!newTicket.sujet || !newTicket.message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await supportService.createTicket(newTicket);
      toast.success('Ticket créé avec succès');
      setShowNewTicketModal(false);
      setNewTicket({ sujet: '', categorie: 'autre', priorite: 'normale', message: '' });
      loadTickets();
      const rolePrefix = user?.role === 'employer' ? '/employer' : '/freelancer';
      navigate(`${rolePrefix}/support`);
    } catch (error) {
      console.error('Erreur création ticket:', error);
      toast.error(error.message || 'Erreur lors de la création du ticket');
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
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setLoadingReply(false);
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

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support</h1>
              <p className="text-gray-600 mt-2">Besoin d'aide ? Notre équipe est là pour vous</p>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau ticket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des tickets */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Mes tickets</h2>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun ticket pour le moment</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        const rolePrefix = user?.role === 'employer' ? '/employer' : '/freelancer';
                        navigate(`${rolePrefix}/support/${ticket.id}`);
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 line-clamp-1">{ticket.sujet}</h3>
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
                      <div className="flex items-center space-x-3">
                        {getStatutBadge(selectedTicket.statut)}
                        {getPrioriteBadge(selectedTicket.priorite)}
                        <span className="text-sm text-gray-500">
                          Ticket #{selectedTicket.id}
                        </span>
                      </div>
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
                      <p className="text-sm mt-2">Notre équipe vous répondra sous peu</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div
                          key={response.id}
                          className={`flex ${response.est_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${response.est_admin
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-100 border border-gray-200'
                              }`}
                          >
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
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
                          placeholder="Écrivez votre réponse..."
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
                        {loadingReply ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un ticket</h3>
                <p className="text-gray-600">Ou créez-en un nouveau pour contacter notre support</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nouveau Ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nouveau ticket de support</h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={newTicket.sujet}
                  onChange={(e) => setNewTicket({ ...newTicket, sujet: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Décrivez brièvement votre problème"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={newTicket.categorie}
                    onChange={(e) => setNewTicket({ ...newTicket, categorie: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={newTicket.priorite}
                    onChange={(e) => setNewTicket({ ...newTicket, priorite: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorites.map((prio) => (
                      <option key={prio.value} value={prio.value}>
                        {prio.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="6"
                  placeholder="Décrivez votre problème en détail..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
