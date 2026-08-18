import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminUsers() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialRole = typeof params.role === 'string' ? params.role : 'all';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      let res = await apiClient.get('/users/all');
      let data = res.data?.data || res.data || [];
      if (!Array.isArray(data) || data.length === 0) {
        res = await apiClient.get('/users');
        data = res.data?.data || res.data || [];
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { bg: '#F3E8FF', color: '#7C3AED', label: 'Admin' };
      case 'freelancer': return { bg: '#FFF7ED', color: '#df6422', label: 'Prestataire' };
      case 'employer': return { bg: '#EFF6FF', color: '#2b4eef', label: 'Recruteur' };
      default: return { bg: '#F1F5F9', color: '#64748B', label: role || 'Utilisateur' };
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const nameStr = `${u.prenom || ''} ${u.nom || ''} ${u.denomination || ''} ${u.email || ''}`.toLowerCase();
    const matchesSearch = nameStr.includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const renderUser = ({ item }: any) => {
    const badge = getRoleBadge(item.role);
    const displayName = item.denomination || `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email || 'Utilisateur';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.avatar, { backgroundColor: badge.bg }]}>
              <Ionicons name={item.role === 'admin' ? 'shield' : item.role === 'employer' ? 'business' : 'person'} size={20} color={badge.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.roleText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {(item.telephone || item.numero_bce || item.secteur) && (
          <View style={styles.cardFooter}>
            {item.numero_bce ? (
              <View style={styles.metaItem}>
                <Ionicons name="document-text-outline" size={14} color="#64748B" />
                <Text style={styles.metaText}>BCE: {item.numero_bce}</Text>
              </View>
            ) : null}
            {item.telephone ? (
              <View style={styles.metaItem}>
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text style={styles.metaText}>{item.indicatif || ''} {item.telephone}</Text>
              </View>
            ) : null}
            {item.statut_verification === 'verifie' && (
              <View style={[styles.metaItem, { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }]}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={[styles.metaText, { color: '#16A34A', fontWeight: '700' }]}>Vérifié</Text>
              </View>
            )}
          </View>
        )}
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
          <Text style={styles.headerTitle}>Utilisateurs</Text>
        </View>
        <Text style={styles.headerCount}>{filteredUsers.length} / {users.length}</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, email, entreprise..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabsRow}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'freelancer', label: 'Prestataires' },
            { id: 'employer', label: 'Recruteurs' },
            { id: 'admin', label: 'Admins' },
          ].map((tab) => {
            const active = selectedRole === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, active && styles.activeTab]}
                onPress={() => setSelectedRole(tab.id)}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <Preloader />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Ionicons name="people-outline" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Aucun utilisateur trouvé</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedRole !== 'all'
                  ? "Aucun résultat ne correspond à vos filtres de recherche."
                  : "Aucun compte n'a été chargé depuis la base de données."}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Actualiser les utilisateurs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 6, marginLeft: -6, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerCount: { fontSize: 13, fontWeight: '700', color: '#7C3AED', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  searchSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  tabsRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  activeTab: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  listContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12, marginRight: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  email: { fontSize: 13, color: '#64748B', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
