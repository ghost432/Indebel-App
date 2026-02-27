import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/messageService';
import { Loader2, Send, MoreVertical, Plus, X } from 'lucide-react';
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
  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-2`}>
    <div className={`max-w-[85%] sm:max-w-xs md:max-w-sm rounded-lg px-3 sm:px-4 py-2 ${isCurrentUser ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>
      <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
      <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-100' : 'text-gray-500'}`}>
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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Lire conversation_id et contact depuis l'URL
  const currentConversation = searchParams.get('conversation_id');
  const contactId = searchParams.get('contact');

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
            recipientType: 'employer' // Contact depuis profil employeur
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
      const users = response.data.data || response.data || [];
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
    setShowNewConversationModal(true);
    loadAvailableUsers();
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
    <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Messagerie</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Liste des conversations */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 bg-white h-full flex flex-col ${currentConversation ? 'hidden md:block md:flex' : 'block flex'}`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.role === 'freelancer' ? 'Recruteurs' : 'Prestataires'}
              </h2>
              <Button
                size="sm"
                onClick={handleOpenNewConversation}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin h-6 w-6 text-primary-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 mb-4">Aucune conversation</p>
                  <Button
                    size="sm"
                    onClick={handleOpenNewConversation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une conversation
                  </Button>
                </div>
              ) : (
                conversations.map(conversation => {
                  // Déterminer l'autre participant
                  const isUser1 = conversation.user1_id === user?.id;
                  const otherUserName = isUser1 
                    ? (conversation.user2_denomination || `${conversation.user2_prenom || ''} ${conversation.user2_nom || ''}`.trim())
                    : (conversation.user1_denomination || `${conversation.user1_prenom || ''} ${conversation.user1_nom || ''}`.trim());
                  
                  return (
                    <div 
                      key={conversation.id}
                      onClick={() => {
                        const basePath = user?.role === 'employer' ? '/employer/mes-messages' : '/freelancer/mes-messages';
                        navigate(`${basePath}?conversation_id=${conversation.id}`);
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        currentConversation == conversation.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium flex-1">
                          {otherUserName || 'Utilisateur'}
                        </div>
                        {/* Badge de messages non lus */}
                        {conversation.unread_count > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                        {conversation.lastMessageContent || 'Aucun message'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Fenêtre de discussion */}
          <div className={`flex-1 flex flex-col bg-gray-50 h-full ${currentConversation ? 'block' : 'hidden md:block'}`}>
            {currentConversation ? (
              <>
                {/* Header fixe */}
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setSearchParams({})}
                    className="md:hidden text-gray-600 hover:text-gray-900"
                  >
                    ←
                  </button>
                  <div className="font-semibold text-sm sm:text-base">
                    {otherUser?.name || 'Sélectionnez une conversation'}
                  </div>
                </div>
                
                {/* Zone de messages avec scroll */}
                <div 
                  className="messages-container flex-1 p-2 sm:p-4 overflow-y-auto overflow-x-hidden" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    minHeight: '200px',
                    maxHeight: 'calc(100vh - 240px)'
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Aucun message. Envoyez le premier!
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
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      className="bg-primary-500 text-white p-2 sm:p-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex-shrink-0"
                      disabled={sending || !newMessage.trim()}
                    >
                      {sending ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center p-6">
                  <h3 className="text-lg font-medium mb-2">Aucune conversation sélectionnée</h3>
                  <p className="text-sm">Sélectionnez une conversation ou créez-en une nouvelle</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour créer une nouvelle conversation */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        title={`Nouvelle conversation avec ${user?.role === 'employer' ? 'un prestataire' : 'une recruteur'}`}
        size="md"
      >
        <div className="max-h-96 overflow-y-auto">
          {loadingUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              Aucun {user?.role === 'employer' ? 'prestataire' : 'recruteur'} disponible
            </div>
          ) : (
            <div className="space-y-2">
              {availableUsers.map(availUser => {
                const displayName = user?.role === 'employer' 
                  ? `${availUser.prenom || ''} ${availUser.nom || ''}`.trim()
                  : availUser.denomination || availUser.nom;
                
                return (
                  <div
                    key={availUser.id}
                    onClick={() => !creatingConversation && handleSelectUser(availUser)}
                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      creatingConversation ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{displayName || 'Utilisateur'}</div>
                        {availUser.poste && (
                          <div className="text-sm text-gray-500">{availUser.poste}</div>
                        )}
                        {availUser.email && (
                          <div className="text-xs text-gray-400">{availUser.email}</div>
                        )}
                      </div>
                      <Plus className="h-5 w-5 text-primary-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {creatingConversation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <Loader2 className="animate-spin h-6 w-6 text-primary-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Création de la conversation...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Messaging;
