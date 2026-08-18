import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function FreelancerSupport() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await apiClient.get('/support/tickets');
      const data = response.data?.data || response.data || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement tickets freelancer:', error);
      setTickets([]);
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

  const handleCreateTicket = async () => {
    if (!sujet.trim() || !message.trim()) {
      Alert.alert("Champs requis", "Veuillez indiquer un sujet et un message.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/support/tickets', { sujet, message });
      Alert.alert("Ticket envoyé", "Votre demande d'assistance a été transmise à notre équipe.");
      setSujet('');
      setMessage('');
      setShowModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Erreur création ticket:', error);
      Alert.alert("Erreur", "Impossible de créer le ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isResolved = item.statut === 'resolu' || item.statut === 'ferme';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sujet} numberOfLines={2}>{item.sujet}</Text>
          <View style={[styles.statusBadge, isResolved ? styles.statusBadgeSuccess : styles.statusBadgePending]}>
            <Text style={[styles.statusText, isResolved ? styles.statusTextSuccess : styles.statusTextPending]}>
              {isResolved ? 'Résolu' : 'En traitement'}
            </Text>
          </View>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.dateText}>{item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : 'Date récente'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Centre d'Aide & Support</Text>
        </View>
        <TouchableOpacity style={styles.newTicketBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#df6422" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="headset-outline" size={42} color="#df6422" />
              </View>
              <Text style={styles.emptyTitle}>Besoin d'assistance ?</Text>
              <Text style={styles.emptySubtitle}>Vous n'avez aucun ticket de support ouvert. Posez-nous votre question !</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowModal(true)}>
                <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Ouvrir un ticket support</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal nouveau ticket */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Ticket Support</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Sujet de votre demande"
              value={sujet}
              onChangeText={setSujet}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre problème ou question en détail..."
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]} 
              onPress={handleCreateTicket}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Envoi...' : 'Envoyer la demande'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtnWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  newTicketBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#df6422', justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sujet: { fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeSuccess: { backgroundColor: '#DCFCE7' },
  statusBadgePending: { backgroundColor: '#FFF7ED' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextSuccess: { color: '#16A34A' },
  statusTextPending: { color: '#df6422' },
  messageText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
  dateText: { fontSize: 12, color: '#94A3B8' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(223,100,34,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(223,100,34,0.2)' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#df6422', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#df6422', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
