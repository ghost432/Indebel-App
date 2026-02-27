import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/messages/conversations');
      setConversations(data.conversations);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/messages/conversations/${conversationId}`);
      setMessages(data.messages);
      return data.messages;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des messages');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (freelancerId, employerId) => {
    try {
      const { data } = await axios.post('/api/messages/conversations', {
        freelancer_id: freelancerId,
        employer_id: employerId
      });
      await fetchConversations();
      return data.conversation;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la conversation');
      throw err;
    }
  };

  const sendMessage = async (conversationId, content) => {
    try {
      const { data } = await axios.post(
        `/api/messages/conversations/${conversationId}/messages`,
        { content }
      );
      await fetchMessages(conversationId);
      return data.message;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du message');
      throw err;
    }
  };

  const updateUnreadCount = (conversationId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
    ));
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    setCurrentConversation,
    fetchConversations,
    fetchMessages,
    startConversation,
    sendMessage,
    updateUnreadCount
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  return useContext(MessagingContext);
};

export default MessagingContext;
