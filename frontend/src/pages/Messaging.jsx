import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/messageService';
import { ArrowLeft, Building2, Loader2, MessageCircle, Plus, Search, Send, UserRound, UsersRound } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

// Fonction utilitaire pour formater l'heure au format HH:MM
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Composant pour un message individuel
const Message = ({ message, isCurrentUser }) => (
  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
    <div className={`max-w-[86%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-sm md:max-w-md ${isCurrentUser ? 'bg-[#2A4DEF] text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>
      <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
      <div className={`mt-1 text-[11px] font-bold ${isCurrentUser ? 'text-white/70' : 'text-slate-400'}`}>
        {formatTime(message.created_at)}
      </div>
    </div>
  </div>
);

// Composant principal de messagerie
const Messaging = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newConversationSearch, setNewConversationSearch] = useState('');
  const [newConversationPage, setNewConversationPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const usersPerPage = 10;
  
  // Lire conversation_id et contact depuis l'URL
  const currentConversation = searchParams.get('conversation_id');
  const contactId = searchParams.get('contact');
  const selectedConversation = conversations.find((conversation) => String(conversation.id) === String(currentConversation));
  const getConversationName = (conversation) => {
    if (!conversation) return '';
    const isUser1 = conversation.user1_id === user?.id;
    return isUser1
      ? (conversation.user2_denomination || `${conversation.user2_prenom || ''} ${conversation.user2_nom || ''}`.trim())
      : (conversation.user1_denomination || `${conversation.user1_prenom || ''} ${conversation.user1_nom || ''}`.trim());
  };
  const selectedName = getConversationName(selectedConversation) || otherUser?.name || 'Conversation';
  const counterpartLabel = user?.role === 'employer' ? 'prestataire' : 'entreprise';
  const counterpartPlural = user?.role === 'employer' ? 'Prestataires' : 'Entreprises';

  const getAvailableUserName = (availableUser) => {
    if (user?.role === 'employer') {
      return `${availableUser.prenom || ''} ${availableUser.nom || ''}`.trim();
    }
    return availableUser.denomination || availableUser.nom || `${availableUser.prenom || ''} ${availableUser.nom || ''}`.trim();
  };

  const filteredAvailableUsers = useMemo(() => {
    const query = newConversationSearch.trim().toLowerCase();
    if (!query) return availableUsers;

    return availableUsers.filter((availableUser) => {
      const searchable = [
        getAvailableUserName(availableUser),
        availableUser.email,
        availableUser.poste,
        availableUser.denomination,
        availableUser.secteur
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [availableUsers, newConversationSearch, user?.role]);

  const newConversationTotalPages = Math.max(1, Math.ceil(filteredAvailableUsers.length / usersPerPage));
  const paginatedAvailableUsers = filteredAvailableUsers.slice(
    (newConversationPage - 1) * usersPerPage,
    newConversationPage * usersPerPage
  );

  useEffect(() => {
    document.title = 'Mes messages - Indebel';
  }, []);

  // Charger les conversations de l'utilisateur
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const response = await messageService.getConversations();
        setConversations(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        toast.error('Impossible de charger les conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id]);

  // Gérer le paramètre contact pour créer/ouvrir une conversation
  useEffect(() => {
    const handleContactParam = async () => {
      if (!contactId || loading) return;
      
      try {
        // Chercher si une conversation existe déjà avec cet utilisateur
        const existingConv = conversations.find(conv => {
          // Vérifier si l'autre utilisateur de la conversation est le contact
          const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
          return otherUserId === parseInt(contactId);
        });
        
        if (existingConv) {
          // Conversation existe déjà, l'ouvrir
          console.log('Conversation existante trouvée:', existingConv.id);
          setSearchParams({ conversation_id: existingConv.id.toString() });
        } else {
          // Créer une nouvelle conversation
          console.log('Création nouvelle conversation avec utilisateur:', contactId);
          const response = await messageService.createConversation({
            recipientId: parseInt(contactId),
            recipientType: user?.role === 'employer' ? 'freelancer' : 'employer'
          });
          if (response.data && response.data.id) {
            setSearchParams({ conversation_id: response.data.id.toString() });
            // Recharger les conversations pour inclure la nouvelle
            const convResponse = await messageService.getConversations();
            setConversations(convResponse.data);
            toast.success('Conversation créée');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la gestion du contact:', error);
        toast.error(error.response?.data?.message || 'Impossible de créer la conversation');
        // Retirer le paramètre contact de l'URL en cas d'erreur
        setSearchParams({});
      }
    };
    
    handleContactParam();
  }, [contactId, conversations, user?.id, loading, setSearchParams]);

  // Charger les messages quand la conversation change
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentConversation) {
        setMessages([]);
        return;
      }

      try {
        const response = await messageService.getMessages(currentConversation);
        setMessages(response.messages || []);
        
        // Scroll vers le bas après chargement
        setTimeout(() => {
          const messagesContainer = document.querySelector('.messages-container');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        toast.error('Impossible de charger les messages');
      }
    };

    loadMessages();
  }, [currentConversation]);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Gérer l'envoi d'un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;
    
    try {
      setSending(true);
      const response = await messageService.sendMessage({
        conversationId: currentConversation,
        content: newMessage.trim()
      });
      
      // response est déjà response.data grâce à messageService
      // Structure: { success: true, message: {...} }
      const newMsg = response.message || response;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Charger la liste des utilisateurs disponibles
  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const endpoint = user?.role === 'employer' ? '/users?role=freelancer' : '/users?role=employer';
      const response = await api.get(endpoint);
      const users = (response.data?.data || response.data) || response.data || [];
      setAvailableUsers(users);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Impossible de charger la liste');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Ouvrir le modal et charger les utilisateurs
  const handleOpenNewConversation = () => {
    setNewConversationSearch('');
    setNewConversationPage(1);
    setShowNewConversationModal(true);
    loadAvailableUsers();
  };

  const handleCloseNewConversation = () => {
    setShowNewConversationModal(false);
    setNewConversationSearch('');
    setNewConversationPage(1);
  };

  // Créer une conversation avec l'utilisateur sélectionné
  const handleSelectUser = async (selectedUser) => {
    setCreatingConversation(true);
    try {
      const newConversation = await messageService.createConversation({
        recipientId: selectedUser.id,
        recipientType: user?.role === 'employer' ? 'freelancer' : 'employer'
      });
      
      const conversationId = newConversation.data?.id || newConversation.id;
      setShowNewConversationModal(false);
      toast.success('Conversation créée');
      
      // Naviguer vers la nouvelle conversation
      const basePath = user?.role === 'employer' ? '/employer/mes-messages' : '/freelancer/mes-messages';
      navigate(`${basePath}?conversation_id=${conversationId}`);
      
      // Recharger la liste des conversations
      const response = await messageService.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast.error('Impossible de créer la conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5">
      <div className="mb-5 overflow-hidden rounded-[28px] bg-[#2A4DEF] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Indebel</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Mes messages</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              Retrouvez vos échanges avec les {user?.role === 'freelancer' ? 'entreprises' : 'prestataires'} et démarrez une discussion sans friction.
            </p>
          </div>
          <Button onClick={handleOpenNewConversation} className="h-11 rounded-2xl bg-[#c02525] px-5 text-sm font-black text-white hover:bg-[#a91f1f]">
            <Plus className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm h-[calc(100vh-180px)] min-h-[620px]">
        <div className="flex h-full flex-col md:flex-row">
          {/* Liste des conversations */}
          <div className={`h-full w-full flex-col border-r border-slate-200 bg-slate-50/80 md:w-[360px] ${currentConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex-shrink-0 border-b border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c02525]">Conversations</p>
                  <h2 className="mt-1 text-lg font-black text-[#2A4DEF]">{counterpartPlural}</h2>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewConversation}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white shadow-sm transition hover:bg-[#4962D5]"
                  aria-label="Créer une conversation"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                <Search className="h-4 w-4 text-slate-400" />
                <span>{conversations.length} conversation(s)</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-7 w-7 animate-spin text-[#2A4DEF]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-black text-slate-700">Aucune conversation</p>
                  <p className="mt-1 text-sm text-slate-500">Sélectionnez {user?.role === 'employer' ? 'un prestataire' : 'une entreprise'} pour lancer un échange.</p>
                  <Button size="sm" onClick={handleOpenNewConversation} className="mt-4 rounded-2xl">
                    <Plus className="h-4 w-4" />
                    Créer une conversation
                  </Button>
                </div>
              ) : (
                conversations.map(conversation => {
                  const otherUserName = getConversationName(conversation);
                  const selected = String(currentConversation) === String(conversation.id);
                  
                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => {
                        const basePath = user?.role === 'employer' ? '/employer/mes-messages' : '/freelancer/mes-messages';
                        navigate(`${basePath}?conversation_id=${conversation.id}`);
                      }}
                      className={`mb-2 w-full rounded-3xl border p-4 text-left transition ${
                        selected ? 'border-[#2A4DEF] bg-white shadow-sm' : 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-[#2A4DEF] text-white' : 'bg-slate-100 text-[#2A4DEF]'}`}>
                          {user?.role === 'freelancer' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-black text-slate-900">{otherUserName || 'Utilisateur'}</p>
                            {conversation.unread_count > 0 && (
                              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#c02525] px-2 text-xs font-black text-white">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 truncate text-sm ${conversation.unread_count > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                            {conversation.lastMessageContent || 'Aucun message'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Fenêtre de discussion */}
          <div className={`h-full flex-1 flex-col bg-[#f6f8fc] ${currentConversation ? 'flex' : 'hidden md:flex'}`}>
            {currentConversation ? (
              <>
                {/* Header fixe */}
                <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white p-4">
                  <button
                    onClick={() => setSearchParams({})}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-[#2A4DEF] md:hidden"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white">
                    {user?.role === 'freelancer' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{selectedName}</p>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{counterpartLabel}</p>
                  </div>
                </div>
                
                {/* Zone de messages avec scroll */}
                <div 
                  className="messages-container flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(42,77,239,0.08),transparent_32%)] p-3 sm:p-5" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    minHeight: '200px',
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      <div className="max-w-sm rounded-[28px] border border-dashed border-slate-300 bg-white/85 p-8 text-center shadow-sm">
                        <MessageCircle className="mx-auto h-12 w-12 text-[#2A4DEF]" />
                        <p className="mt-4 font-black text-slate-800">Aucun message pour le moment</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Envoyez le premier message pour démarrer la conversation.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map(message => (
                        <Message 
                          key={message.id} 
                          message={message}
                          isCurrentUser={message.sender_id === user.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Formulaire fixe en bas */}
                <form onSubmit={handleSendMessage} className="flex-shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="min-h-11 flex-1 bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white shadow-sm transition hover:bg-[#4962D5] disabled:opacity-50"
                      disabled={sending || !newMessage.trim()}
                      aria-label="Envoyer"
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                <div className="max-w-sm rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <UsersRound className="mx-auto h-14 w-14 text-[#2A4DEF]" />
                  <h3 className="mt-5 text-xl font-black text-slate-900">Aucune conversation sélectionnée</h3>
                  <p className="mt-2 text-sm leading-6">Sélectionnez une conversation ou créez-en une nouvelle.</p>
                  <Button onClick={handleOpenNewConversation} className="mt-5 rounded-2xl">
                    <Plus className="h-4 w-4" />
                    Nouvelle conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour créer une nouvelle conversation */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={handleCloseNewConversation}
        title={`Nouvelle conversation avec ${user?.role === 'employer' ? 'un prestataire' : 'une entreprise'}`}
        size="md"
      >
        <div className="-mx-2 max-h-[68vh] overflow-y-auto px-2">
          <div className="mb-4 rounded-[24px] bg-[#2A4DEF] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                {user?.role === 'employer' ? <UserRound className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Contact</p>
                <p className="text-lg font-black">{user?.role === 'employer' ? 'Choisir un prestataire' : 'Choisir une entreprise'}</p>
              </div>
            </div>
          </div>
          <div className="mb-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="search"
                value={newConversationSearch}
                onChange={(event) => {
                  setNewConversationSearch(event.target.value);
                  setNewConversationPage(1);
                }}
                placeholder={`Rechercher ${user?.role === 'employer' ? 'un prestataire' : 'une entreprise'}`}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                {filteredAvailableUsers.length}
              </span>
            </div>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#2A4DEF]" />
            </div>
          ) : filteredAvailableUsers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Aucun {user?.role === 'employer' ? 'prestataire' : 'entreprise'} trouvé
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedAvailableUsers.map(availUser => {
                  const displayName = getAvailableUserName(availUser);
                  
                  return (
                    <button
                      type="button"
                      key={availUser.id}
                      onClick={() => !creatingConversation && handleSelectUser(availUser)}
                      className={`w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#2A4DEF] hover:bg-slate-50 ${
                        creatingConversation ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#2A4DEF]">
                            {user?.role === 'employer' ? <UserRound className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                          <div className="truncate font-black text-slate-900">{displayName || 'Utilisateur'}</div>
                          {availUser.poste && (
                            <div className="truncate text-sm font-semibold text-slate-500">{availUser.poste}</div>
                          )}
                          {availUser.email && (
                            <div className="truncate text-xs font-medium text-slate-400">{availUser.email}</div>
                          )}
                          </div>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c02525] text-white">
                          <Plus className="h-5 w-5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {newConversationTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white p-3">
                  <button
                    type="button"
                    onClick={() => setNewConversationPage((page) => Math.max(1, page - 1))}
                    disabled={newConversationPage === 1}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-[#082151] transition hover:border-[#2A4DEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <span className="text-sm font-bold text-slate-500">
                    Page {newConversationPage} / {newConversationTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewConversationPage((page) => Math.min(newConversationTotalPages, page + 1))}
                    disabled={newConversationPage === newConversationTotalPages}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-[#082151] transition hover:border-[#2A4DEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
          
          {creatingConversation && (
            <div className="mt-4 rounded-[24px] bg-blue-50 p-4 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#2A4DEF]" />
              <p className="text-sm font-bold text-slate-600">Création de la conversation...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Messaging;
