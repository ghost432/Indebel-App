import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function EmployerMissions() {
  const router = useRouter();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMissions = useCallback(async () => {
    try {
      const response = await apiClient.get('/missions/employer');
      const rawData = response.data?.data || response.data || [];
      setMissions(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error('Erreur chargement missions', error);
      setMissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions();
  };

  const renderItem = ({ item }: any) => {
    const isOpen = item.statut === 'ouverte' || item.statut === 'ouvert' || item.status === 'Ouvert';
    const statusText = isOpen ? 'Ouvert' : (item.statut === 'fermee' ? 'Fermé' : item.statut || 'Fermé');
    const dateStr = item.date_creation || item.created_at;
    const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Date inconnue';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({
          pathname: '/employer/mission/[id]',
          params: { id: String(item.id), type: item.mission_type || item.type_forfait || 'hourly', source: item.source || 'employer' }
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.titre || item.title || 'Mission sans titre'}</Text>
          <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
            <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.date}>Publié le {formattedDate}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.detailText}>Voir les détails</Text>
          <Ionicons name="arrow-forward" size={16} color="#2b4eef" />
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
          <Text style={styles.headerTitle}>Mes Missions</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={missions}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4eef" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="briefcase-outline" size={42} color="#2b4eef" />
              </View>
              <Text style={styles.emptyTitle}>Aucune mission trouvée</Text>
              <Text style={styles.emptySubtitle}>Vous n'avez pas encore publié de mission. Cliquez ci-dessous pour actualiser.</Text>
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
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2b4eef', justifyContent: 'center', alignItems: 'center', shadowColor: '#2b4eef', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  listContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12, lineHeight: 22 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusOpen: { backgroundColor: '#DCFCE7' },
  statusClosed: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextOpen: { color: '#16A34A' },
  statusTextClosed: { color: '#64748B' },
  date: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  detailText: { fontSize: 14, fontWeight: '700', color: '#2b4eef' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2b4eef', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#2b4eef', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
