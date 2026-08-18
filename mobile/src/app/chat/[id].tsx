import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';
import PremiumBackground from '../../components/PremiumBackground';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  photo_profil?: string;
  prenom?: string;
  nom?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id, name, avatar } = useLocalSearchParams<{ id: string; name: string; avatar: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<any>(null);

  const fetchMessages = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await apiClient.get(`/messages/conversations/${id}`);
      setMessages(response.data?.messages || []);
    } catch (error: any) {
      console.error('❌ Erreur chargement messages chat:', error.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    async function initChat() {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setCurrentUserId(user.id);
      }
      await fetchMessages(true);
    }
    initChat();
  }, [fetchMessages]);

  // Polling for new messages every 4 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchMessages]);

  // Auto scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    Keyboard.dismiss();

    try {
      const response = await apiClient.post(`/messages/conversations/${id}/messages`, {
        content
      });

      if (response.data?.success) {
        const sentMsg = response.data.message;
        setMessages(prev => [...prev, sentMsg]);
      }
    } catch (error: any) {
      console.error('❌ Erreur envoi message:', error.message);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#082151" />
          </TouchableOpacity>
          <View style={styles.recipientInfo}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#94A3B8" />
              </View>
            )}
            <Text style={styles.recipientName} numberOfLines={1}>
              {name || 'Conversation'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#082151" />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isMine = item.sender_id === currentUserId;
                return (
                  <View style={[styles.bubbleWrapper, isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
                    <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                      <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                      </Text>
                      <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
                        {formatMessageTime(item.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder="Écrivez votre message..."
                placeholderTextColor="#94A3B8"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !newMessage.trim() && styles.disabledSendBtn]}
                onPress={handleSend}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  recipientInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recipientName: { fontSize: 16, fontWeight: '800', color: '#082151', flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, paddingBottom: 24 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: 12, width: '100%' },
  myBubbleWrapper: { justifyContent: 'flex-end' },
  theirBubbleWrapper: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 0.5,
  },
  myBubble: {
    backgroundColor: '#2B4EEF',
    borderTopRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderTopLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#0F172A' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimeText: { color: 'rgba(255, 255, 255, 0.7)' },
  theirTimeText: { color: '#94A3B8' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.6)',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#0F172A',
    maxHeight: 100,
    marginRight: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2B4EEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B4EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledSendBtn: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
});
