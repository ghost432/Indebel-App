import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await apiClient.get('/support/admin/tickets');
      const data = response.data?.data || response.data?.tickets || response.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Erreur /support/admin/tickets, fallback /support/tickets:', error);
      try {
        const userTicketsRes = await apiClient.get('/support/tickets');
        const userTicketsData = userTicketsRes.data?.data || userTicketsRes.data || [];
        setTickets(Array.isArray(userTicketsData) ? userTicketsData : []);
      } catch (err) {
        console.error('Erreur chargement tickets:', err);
        setTickets([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleUpdateStatus = async (ticketId: number | string, newStatus: string) => {
    try {
      await apiClient.patch(`/support/admin/tickets/${ticketId}/status`, { statut: newStatus });
      Alert.alert("Statut Mis à Jour", `Le ticket est désormais "${newStatus}".`);
      fetchTickets();
    } catch (error) {
      console.error('Erreur maj statut ticket:', error);
      Alert.alert("Erreur", "Impossible de modifier le statut.");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/support/tickets/${selectedTicket.id}/responses`, {
        message: responseText
      });
      Alert.alert("Réponse Envoyée", "Votre réponse a été transmise à l'utilisateur.");
      setResponseText('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
      Alert.alert("Erreur", "Impossible d'envoyer la réponse.");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'resolu': case 'ferme': return { bg: '#DCFCE7', color: '#16A34A', label: 'Résolu' };
      case 'en_cours': return { bg: '#FEF3C7', color: '#B45309', label: 'En cours' };
      default: return { bg: '#EFF6FF', color: '#2563EB', label: 'Ouvert' };
    }
  };

  const renderItem = ({ item }: any) => {
    const badge = getStatusBadge(item.statut);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sujet} numberOfLines={2}>{item.sujet || item.titre || 'Ticket sans sujet'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.messagePreview} numberOfLines={3}>{item.message || item.description || 'Pas de description'}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={15} color="#64748B" />
          <Text style={styles.infoText}>{item.user_email || item.email || item.prenom || 'Utilisateur'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : 'Récent'}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.replyButton} onPress={() => setSelectedTicket(item)}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#7C3AED" />
              <Text style={styles.replyButtonText}>Répondre</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resolveButton} 
              onPress={() => handleUpdateStatus(item.id, 'resolu')}
            >
              <Ionicons name="checkmark-done" size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={() => router.push('/admin')}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support & Tickets</Text>
        </View>
        <Text style={styles.headerCount}>{tickets.length} tickets</Text>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="headset-outline" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Aucun ticket de support</Text>
              <Text style={styles.emptySubtitle}>Aucune demande d'assistance n'a été soumise pour le moment.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Response Modal */}
      {selectedTicket && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Répondre au Ticket #{selectedTicket.id}</Text>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSujet}>{selectedTicket.sujet}</Text>
              <Text style={styles.modalMessage}>{selectedTicket.message}</Text>

              <TextInput
                style={styles.replyInput}
                placeholder="Saisissez votre réponse pour l'utilisateur..."
                multiline
                numberOfLines={4}
                value={responseText}
                onChangeText={setResponseText}
              />

              <TouchableOpacity 
                style={[styles.sendBtn, sending && { opacity: 0.6 }]} 
                onPress={handleSendResponse}
                disabled={sending}
              >
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>{sending ? 'Envoi...' : 'Envoyer la réponse'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtnWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerCount: { fontSize: 13, fontWeight: '700', color: '#7C3AED', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sujet: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  messagePreview: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  dateText: { fontSize: 12, color: '#94A3B8' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  replyButtonText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  resolveButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSujet: { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  modalMessage: { fontSize: 14, color: '#475569', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
  replyInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, textAlignVertical: 'top', minHeight: 100 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 14 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
