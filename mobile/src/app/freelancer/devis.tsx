import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function FreelancerDevis() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'soumis' | 'disponibles'>('soumis');
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevis = useCallback(async () => {
    try {
      const endpoint = activeTab === 'soumis' ? '/devis-soumis/mes-devis' : '/devis-soumis/disponibles';
      const response = await apiClient.get(endpoint);
      const rawData = response.data?.data || response.data || [];
      setDevis(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error(`Erreur chargement devis (${activeTab}):`, error);
      setDevis([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchDevis();
  }, [fetchDevis]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDevis();
  };

  const renderItem = ({ item }: any) => {
    if (activeTab === 'soumis') {
      const isRejected = item.statut === 'refuse' || item.status === 'Refusé';
      const isAccepted = item.statut === 'accepte' || item.statut === 'valide' || item.status === 'Accepté';
      const statusText = isAccepted ? 'Accepté' : (isRejected ? 'Refusé' : item.statut || 'En attente');

      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push({
            pathname: '/freelancer/devis/[id]',
            params: { id: String(item.id) }
          })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={2}>{item.type_travaux || item.titre || 'Devis proposé'}</Text>
            <Text style={styles.amount}>{item.montant_ttc || item.montant || item.montant_ht ? `${item.montant_ttc || item.montant || item.montant_ht}€` : ''}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Ionicons name="person-outline" size={16} color="#64748B" />
            <Text style={styles.clientText}>{item.client_prenom ? `${item.client_prenom} ${item.client_nom || ''}` : (item.ville || 'Client')}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, isRejected ? styles.statusRejected : (isAccepted ? styles.statusAccepted : styles.statusPending)]}>
              <Text style={[styles.statusText, isRejected ? styles.statusTextRejected : (isAccepted ? styles.statusTextAccepted : styles.statusTextPending)]}>{statusText}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#df6422" />
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push({
            pathname: '/freelancer/devis/[id]',
            params: { id: String(item.id) }
          })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={2}>{item.type_travaux || 'Opportunité de devis'}</Text>
            <Text style={styles.amount}>{item.budget_estime ? `${item.budget_estime}€` : 'Budget N/C'}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.clientText}>{item.ville ? `${item.ville} (${item.code_postal || ''})` : 'Localisation non spécifiée'}</Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, styles.statusOpportunity]}>
              <Text style={[styles.statusText, styles.statusTextOpportunity]}>Disponible</Text>
            </View>
            <Text style={styles.actionLinkText}>Proposer un devis →</Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/freelancer')}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestion Devis</Text>
        </View>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'soumis' && styles.tabButtonActive]}
          onPress={() => setActiveTab('soumis')}
        >
          <Ionicons name="paper-plane-outline" size={16} color={activeTab === 'soumis' ? '#df6422' : '#64748B'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'soumis' && styles.tabTextActive]}>Devis Soumis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'disponibles' && styles.tabButtonActive]}
          onPress={() => setActiveTab('disponibles')}
        >
          <Ionicons name="briefcase-outline" size={16} color={activeTab === 'disponibles' ? '#df6422' : '#64748B'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'disponibles' && styles.tabTextActive]}>Opportunités</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={devis}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#df6422" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name={activeTab === 'soumis' ? "document-text-outline" : "search-outline"} size={42} color="#df6422" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'soumis' ? "Aucun devis soumis" : "Aucune opportunité disponible"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'soumis' 
                  ? "Vous n'avez pas encore envoyé de devis aux clients. Consultez l'onglet 'Opportunités' pour répondre aux demandes."
                  : "Aucune nouvelle demande de devis ne correspond actuellement à votre profil. Revenez plus tard ou rafraîchissez."}
              </Text>
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
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#FFFFFF', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
  tabButtonActive: { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#df6422', fontWeight: '700' },
  listContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12, lineHeight: 22 },
  amount: { fontSize: 18, fontWeight: '800', color: '#df6422' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  clientText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusAccepted: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusOpportunity: { backgroundColor: '#EFF6FF' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextRejected: { color: '#EF4444' },
  statusTextAccepted: { color: '#16A34A' },
  statusTextPending: { color: '#B45309' },
  statusTextOpportunity: { color: '#2563EB' },
  actionLinkText: { fontSize: 13, fontWeight: '700', color: '#df6422' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFEDD5' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#df6422', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#df6422', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
