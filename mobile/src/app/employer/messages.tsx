import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';
import PremiumBackground from '../../components/PremiumBackground';

interface Conversation {
  id: number;
  freelancer_id: number;
  employer_id: number;
  user1_id: number;
  user1_prenom?: string;
  user1_nom?: string;
  user1_denomination?: string;
  user1_photo?: string;
  user2_id: number;
  user2_prenom?: string;
  user2_nom?: string;
  user2_denomination?: string;
  user2_photo?: string;
  last_message?: string;
  last_message_date?: string;
  unread_count: number;
}

export default function EmployerMessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setCurrentUserId(user.id);
      }

      const response = await apiClient.get('/messages/conversations');
      setConversations(response.data?.data || []);
    } catch (error: any) {
      console.error('❌ Erreur chargement conversations:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getParticipantDetails = (item: Conversation) => {
    const isUser1 = item.user1_id === currentUserId;
    
    // Si l'utilisateur connecté est User1 (Freelancer), alors le participant est User2 (Employer)
    // Sinon le participant est User1 (Freelancer)
    const name = isUser1
      ? (item.user2_denomination || `${item.user2_prenom || ''} ${item.user2_nom || ''}`.trim())
      : (item.user1_denomination || `${item.user1_prenom || ''} ${item.user1_nom || ''}`.trim());
      
    const photo = isUser1 ? item.user2_photo : item.user1_photo;
    
    return {
      name: name || 'Utilisateur',
      photo: photo
    };
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#082151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messagerie</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#082151" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBadge}>
              <Ionicons name="chatbubbles-outline" size={42} color="#2b4eef" />
            </View>
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
              Vos conversations et échanges de messages avec les prestataires s'afficheront ici.
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={handleRefresh}>
              <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyActionBtnText}>Actualiser les messages</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#082151" />
            }
            renderItem={({ item }) => {
              const participant = getParticipantDetails(item);
              return (
                <TouchableOpacity
                  style={[styles.card, item.unread_count > 0 && styles.unreadCard]}
                  onPress={() => {
                    router.push({
                      pathname: "/chat/[id]",
                      params: { id: item.id.toString(), name: participant.name, avatar: participant.photo || '' }
                    });
                  }}
                >
                  <View style={styles.avatarContainer}>
                    {participant.photo ? (
                      <Image source={{ uri: participant.photo }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={24} color="#94A3B8" />
                      </View>
                    )}
                    {item.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {participant.name}
                      </Text>
                      <Text style={styles.timeText}>
                        {formatTime(item.last_message_date)}
                      </Text>
                    </View>
                    <Text style={[styles.lastMessageText, item.unread_count > 0 && styles.unreadLastMessage]} numberOfLines={1}>
                      {item.last_message || 'Pas encore de message.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#082151' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(43,78,239,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(43,78,239,0.2)',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#082151', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2b4eef',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#2b4eef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(43, 78, 239, 0.25)',
    borderWidth: 1,
    shadowColor: '#2B4EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2B4EEF',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  participantName: { fontSize: 16, fontWeight: '700', color: '#082151', flex: 1, marginRight: 8 },
  timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  lastMessageText: { fontSize: 14, color: '#64748B' },
  unreadLastMessage: { color: '#082151', fontWeight: '600' },
});
