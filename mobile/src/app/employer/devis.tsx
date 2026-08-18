import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function EmployerDevis() {
  const router = useRouter();
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevis = useCallback(async () => {
    try {
      const response = await apiClient.get('/devis/mes-demandes');
      const rawData = response.data?.data || response.data || [];
      setDevis(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error('Erreur chargement devis employer:', error);
      setDevis([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevis();
  }, [fetchDevis]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevis();
  };

  const renderItem = ({ item }: any) => {
    const isAccepted = item.statut === 'valide' || item.statut === 'traite' || item.status === 'Accepté';
    const statusText = item.statut === 'valide' ? 'Validé' : (item.statut === 'refuse' ? 'Refusé' : item.statut || 'En attente');
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({
          pathname: '/employer/devis/[id]',
          params: { id: String(item.id) }
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.titre || item.titre_projet || item.type_travaux || 'Projet sans titre'}</Text>
          <Text style={styles.amount}>{item.montant || item.budget_estime ? `${item.montant || item.budget_estime}€` : ''}</Text>
        </View>
        <View style={styles.freelancerInfo}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.freelancerText}>{item.ville ? `${item.ville} (${item.code_postal || ''})` : 'Localisation non spécifiée'}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isAccepted ? styles.statusAccepted : styles.statusPending]}>
            <Text style={[styles.statusText, isAccepted ? styles.statusTextAccepted : styles.statusTextPending]}>{statusText}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#2b4eef" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/employer')}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Devis</Text>
        </View>
      </View>
      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={devis}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4eef" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="document-text-outline" size={42} color="#2b4eef" />
              </View>
              <Text style={styles.emptyTitle}>Aucune demande de devis</Text>
              <Text style={styles.emptySubtitle}>Vous n'avez pas encore créé de demande de devis. Vos demandes apparaîtront ici une fois soumises.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Actualiser les devis</Text>
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
  amount: { fontSize: 18, fontWeight: '800', color: '#2b4eef' },
  freelancerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  freelancerText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusAccepted: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextAccepted: { color: '#16A34A' },
  statusTextPending: { color: '#B45309' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b4eef', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#2b4eef', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
