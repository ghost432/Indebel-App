import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminDevis() {
  const router = useRouter();
  const [devisList, setDevisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminDevis = useCallback(async () => {
    try {
      const response = await apiClient.get('/devis');
      const rawData = response.data?.data || response.data || [];
      setDevisList(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error('Erreur chargement devis admin:', error);
      setDevisList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminDevis();
  }, [fetchAdminDevis]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminDevis();
  };

  const renderItem = ({ item }: any) => {
    const isValide = item.statut === 'valide' || item.statut === 'accepte';
    const isRefuse = item.statut === 'refuse' || item.statut === 'rejete';
    const statusText = isValide ? 'Validé' : (isRefuse ? 'Refusé' : item.statut || 'En attente');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.type_travaux || item.titre || 'Demande de devis'}</Text>
          <View style={[styles.statusBadge, isValide ? styles.statusValide : (isRefuse ? styles.statusRefuse : styles.statusPending)]}>
            <Text style={[styles.statusText, isValide ? styles.statusTextValide : (isRefuse ? styles.statusTextRefuse : styles.statusTextPending)]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.prenom ? `${item.prenom} ${item.nom || ''}` : (item.email || 'Demandeur')}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.ville ? `${item.ville} (${item.code_postal || ''})` : 'Ville non renseignée'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : 'Date récente'}</Text>
          <Text style={styles.budgetText}>{item.budget_estime ? `${item.budget_estime}€` : 'Devis sur mesure'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/admin')}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Supervision Devis</Text>
        </View>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={devisList}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="document-text-outline" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Aucun devis enregistré</Text>
              <Text style={styles.emptySubtitle}>Aucune demande ou devis soumis pour le moment sur la plateforme.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 8, marginLeft: -8, borderRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  listContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12, lineHeight: 22 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusValide: { backgroundColor: '#DCFCE7' },
  statusRefuse: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextValide: { color: '#16A34A' },
  statusTextRefuse: { color: '#EF4444' },
  statusTextPending: { color: '#B45309' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  infoText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  dateText: { fontSize: 12, color: '#94A3B8' },
  budgetText: { fontSize: 15, fontWeight: '800', color: '#7C3AED' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
