import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    total_freelancers: 0,
    total_employers: 0,
    total_admins: 0,
    total_devis: 0,
    total_missions: 0,
    total_tickets: 0,
  });

  const fetchStats = async () => {
    let usersCount = 0;
    let freelancersCount = 0;
    let employersCount = 0;
    let adminsCount = 0;
    let devisCount = 0;
    let missionsCount = 0;
    let ticketsCount = 0;

    // Fetch users stats / users list
    try {
      const usersRes = await apiClient.get('/users/all');
      const usersList = usersRes.data?.data || usersRes.data || [];
      if (Array.isArray(usersList) && usersList.length > 0) {
        usersCount = usersList.length;
        freelancersCount = usersList.filter((u: any) => u.role === 'freelancer').length;
        employersCount = usersList.filter((u: any) => u.role === 'employer').length;
        adminsCount = usersList.filter((u: any) => u.role === 'admin').length;
      }
    } catch (e) {
      console.log('Erreur fetch users list in stats:', e);
    }

    // Fetch devis count
    try {
      const devisRes = await apiClient.get('/devis/all');
      const devisList = devisRes.data?.data || devisRes.data || [];
      if (Array.isArray(devisList)) devisCount = devisList.length;
    } catch (e) {
      console.log('Erreur fetch devis stats:', e);
    }

    // Fetch missions count
    try {
      const missionsRes = await apiClient.get('/missions/all');
      const missionsList = missionsRes.data?.data || missionsRes.data || [];
      if (Array.isArray(missionsList)) missionsCount = missionsList.length;
    } catch (e) {
      console.log('Erreur fetch missions stats:', e);
    }

    // Fetch tickets count
    try {
      const ticketsRes = await apiClient.get('/support/tickets');
      const ticketsList = ticketsRes.data?.data || ticketsRes.data || [];
      if (Array.isArray(ticketsList)) ticketsCount = ticketsList.length;
    } catch (e) {
      console.log('Erreur fetch tickets stats:', e);
    }

    setStats({
      total_users: usersCount,
      total_freelancers: freelancersCount,
      total_employers: employersCount,
      total_admins: adminsCount,
      total_devis: devisCount,
      total_missions: missionsCount,
      total_tickets: ticketsCount,
    });
  };

  const loadData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchStats();
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error loading admin dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return <Preloader />;
  }

  const name = user?.prenom || user?.nom || user?.email || 'Admin';
  const avatarUri = user?.profile_image_url || user?.photo_profil || user?.avatar || user?.photo;
  
  const getInitials = () => {
    if (user?.prenom || user?.nom) {
      return `${(user?.prenom || '').charAt(0)}${(user?.nom || '').charAt(0)}`.toUpperCase() || 'AD';
    }
    return 'AD';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft} 
            onPress={() => router.push('/admin/profil' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.profileImagePlaceholder}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              )}
            </View>
            <View>
              <Text style={styles.greeting}>Admin Panel</Text>
              <Text style={styles.userName}>{name}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/admin/tickets' as any)}>
              <Ionicons name="chatbubbles-outline" size={22} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#7C3AED" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Ionicons name="shield" size={40} color="rgba(255,255,255,0.15)" style={styles.heroIconBackground} />
            <Text style={styles.heroTitle}>Administration Indebel</Text>
            <Text style={styles.heroSubtitle}>Supervision globale des utilisateurs, des devis et des missions de la plateforme.</Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Statistiques Globales</Text>

          <View style={styles.statsGrid}>
            {/* Stat 1: Total Users */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/admin/users' as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                <Ionicons name="people" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>{stats.total_users}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </TouchableOpacity>

            {/* Stat 2: Prestataires */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push({ pathname: '/admin/users', params: { role: 'freelancer' } } as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(223, 100, 34, 0.1)' }]}>
                <Ionicons name="hammer" size={22} color="#df6422" />
              </View>
              <Text style={styles.statValue}>{stats.total_freelancers}</Text>
              <Text style={styles.statLabel}>Prestataires</Text>
            </TouchableOpacity>

            {/* Stat 3: Recruteurs */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push({ pathname: '/admin/users', params: { role: 'employer' } } as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(43, 78, 239, 0.1)' }]}>
                <Ionicons name="business" size={22} color="#2b4eef" />
              </View>
              <Text style={styles.statValue}>{stats.total_employers}</Text>
              <Text style={styles.statLabel}>Recruteurs</Text>
            </TouchableOpacity>

            {/* Stat 4: Devis */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/admin/devis' as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(67, 56, 202, 0.1)' }]}>
                <Ionicons name="document-text" size={22} color="#4338CA" />
              </View>
              <Text style={styles.statValue}>{stats.total_devis}</Text>
              <Text style={styles.statLabel}>Devis</Text>
            </TouchableOpacity>

            {/* Stat 5: Missions */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/admin/missions' as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
                <Ionicons name="briefcase" size={22} color="#0EA5E9" />
              </View>
              <Text style={styles.statValue}>{stats.total_missions}</Text>
              <Text style={styles.statLabel}>Missions</Text>
            </TouchableOpacity>

            {/* Stat 6: Tickets / Support */}
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/admin/tickets' as any)}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(217, 70, 239, 0.1)' }]}>
                <Ionicons name="chatbubbles" size={22} color="#D946EF" />
              </View>
              <Text style={styles.statValue}>{stats.total_tickets}</Text>
              <Text style={styles.statLabel}>Support</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Accès rapide</Text>

          <View style={styles.actionsList}>
            {/* Action 1: Users */}
            <TouchableOpacity onPress={() => router.push('/admin/users' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="people" size={22} color="#7C3AED" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Gestion Utilisateurs</Text>
                  <Text style={styles.actionDesc}>Consulter et superviser les {stats.total_users} comptes.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Action 2: Devis */}
            <TouchableOpacity onPress={() => router.push('/admin/devis' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="document-text" size={22} color="#4338CA" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Gestion des Devis</Text>
                  <Text style={styles.actionDesc}>Superviser les devis et demandes de devis.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Action 3: Missions */}
            <TouchableOpacity onPress={() => router.push('/admin/missions' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="briefcase" size={22} color="#0EA5E9" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Gestion Missions</Text>
                  <Text style={styles.actionDesc}>Superviser toutes les missions créées.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Action 4: Support / Tickets */}
            <TouchableOpacity onPress={() => router.push('/admin/tickets' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#FAE8FF' }]}>
                  <Ionicons name="chatbubbles" size={22} color="#D946EF" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Support & Tickets Admin</Text>
                  <Text style={styles.actionDesc}>Répondre aux demandes d'assistance.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Action 5: Verifications */}
            <TouchableOpacity onPress={() => router.push('/admin/verifications' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#16A34A" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Vérification d'Identité (BCE)</Text>
                  <Text style={styles.actionDesc}>Valider ou refuser les comptes en attente.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Action 6: Settings */}
            <TouchableOpacity onPress={() => router.push('/admin/settings' as any)}>
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="settings" size={22} color="#B45309" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Paramètres</Text>
                  <Text style={styles.actionDesc}>Configuration système et profil admin.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileImagePlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#7C3AED', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  greeting: { fontSize: 13, color: '#7C3AED', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  scrollContent: { padding: 24 },
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 24, position: 'relative', overflow: 'hidden', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 6 },
  heroIconBackground: { position: 'absolute', right: -10, top: -10, transform: [{ scale: 2.5 }] },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, width: '85%' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard: { width: '31%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', padding: 12, borderRadius: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600', textAlign: 'center' },
  actionsList: { gap: 12 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  actionDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
});
