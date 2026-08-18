import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminVerifications() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/all');
      const rawData = response.data?.data || response.data || [];
      const allUsers = Array.isArray(rawData) ? rawData : [];
      // Filter for users needing verification or show all users with status
      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs vérification:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingUsers();
  };

  const handleVerifyUser = async (userId: string | number, action: 'valider' | 'refuser') => {
    try {
      const isApprove = action === 'valider';
      await apiClient.put(`/users/${userId}`, {
        statut_verification: isApprove ? 'verifie' : 'refuse',
        is_verified: isApprove ? 1 : 0
      });
      Alert.alert(
        isApprove ? "Compte Validé" : "Compte Refusé",
        `L'utilisateur a été ${isApprove ? 'marqué comme vérifié' : 'refusé'} avec succès.`
      );
      fetchPendingUsers();
    } catch (error) {
      console.error('Erreur mise à jour statut vérification:', error);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const renderItem = ({ item }: any) => {
    const isVerified = item.statut_verification === 'verifie' || item.is_verified === 1;
    const isRefused = item.statut_verification === 'refuse';
    const roleText = item.role === 'employer' ? 'Recruteur' : (item.role === 'freelancer' ? 'Prestataire' : 'Utilisateur');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.denomination || `${item.prenom || ''} ${item.nom || ''}`.trim() || 'Utilisateur'}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, item.role === 'employer' ? styles.roleEmployer : styles.roleFreelancer]}>
            <Text style={styles.roleText}>{roleText}</Text>
          </View>
        </View>

        <View style={styles.bceBox}>
          <Ionicons name="barcode-outline" size={16} color="#64748B" />
          <Text style={styles.bceText}>Numéro BCE: {item.numero_bce || 'Non renseigné'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isVerified ? styles.statusVerified : (isRefused ? styles.statusRefused : styles.statusPending)]}>
            <Ionicons name={isVerified ? "checkmark-circle" : (isRefused ? "close-circle" : "time")} size={14} color={isVerified ? "#16A34A" : (isRefused ? "#EF4444" : "#B45309")} />
            <Text style={[styles.statusText, isVerified ? styles.statusTextVerified : (isRefused ? styles.statusTextRefused : styles.statusTextPending)]}>
              {isVerified ? 'Vérifié' : (isRefused ? 'Refusé' : 'En attente')}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]} 
              onPress={() => handleVerifyUser(item.id, 'valider')}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Valider</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]} 
              onPress={() => handleVerifyUser(item.id, 'refuser')}
            >
              <Ionicons name="close" size={16} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Refuser</Text>
            </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Vérification Identité</Text>
        </View>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="shield-checkmark-outline" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Aucune demande de vérification</Text>
              <Text style={styles.emptySubtitle}>Tous les utilisateurs sont actuellement vérifiés.</Text>
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
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  email: { fontSize: 13, color: '#64748B', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleEmployer: { backgroundColor: '#EFF6FF' },
  roleFreelancer: { backgroundColor: '#FFF7ED' },
  roleText: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  bceBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 14 },
  bceText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusVerified: { backgroundColor: '#DCFCE7' },
  statusRefused: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextVerified: { color: '#16A34A' },
  statusTextRefused: { color: '#EF4444' },
  statusTextPending: { color: '#B45309' },
  actionButtonsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  approveButton: { backgroundColor: '#16A34A' },
  rejectButton: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
