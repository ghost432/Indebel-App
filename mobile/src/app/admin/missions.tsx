import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminMissions() {
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await apiClient.get('/missions');
      const data = res.data?.data || res.data || [];
      setMissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching missions:', error);
      setMissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions();
  };

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'ouvert': case 'disponible': case 'active': return { bg: '#DCFCE7', color: '#16A34A', text: 'Disponible' };
      case 'ferme': case 'termine': return { bg: '#FEE2E2', color: '#EF4444', text: 'Terminé' };
      case 'en_cours': case 'attribue': return { bg: '#FEF3C7', color: '#B45309', text: 'En cours' };
      default: return { bg: '#F1F5F9', color: '#64748B', text: statut || 'Actif' };
    }
  };

  const renderMission = ({ item }: any) => {
    const status = getStatusStyle(item.statut);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.title} numberOfLines={2}>{item.titre || item.type_travaux || 'Mission sans titre'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>{item.denomination || item.employer_name || 'Entreprise'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color="#64748B" />
            <Text style={styles.metaText}>{item.localisation || item.ville || 'Non défini'}</Text>
          </View>
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
          <Text style={styles.headerTitle}>Missions</Text>
        </View>
        <Text style={styles.headerCount}>{missions.length} missions</Text>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={missions}
          renderItem={renderMission}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="briefcase-outline" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Aucune mission enregistrée</Text>
              <Text style={styles.emptySubtitle}>Aucune mission n'a été publiée sur la plateforme pour le moment.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Actualiser les missions</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 8, marginLeft: -8, borderRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerCount: { fontSize: 13, fontWeight: '700', color: '#7C3AED', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  listContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12, lineHeight: 22 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardMeta: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
