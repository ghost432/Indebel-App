import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';

export default function EmployerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDemandes: 0,
    accepted: 0,
    pending: 0,
    totalMissions: 0,
    openMissions: 0,
  });

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchStats();
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error loading employer dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [missionsRes, demandesRes] = await Promise.all([
        apiClient.get('/missions/employer'),
        apiClient.get('/demandes/employer')
      ]);
      
      const missions = missionsRes.data?.data || [];
      const demandes = demandesRes.data?.data || [];
      
      setStats({
        totalMissions: missions.length,
        openMissions: missions.filter((m: any) => m.statut === 'ouvert').length,
        totalDemandes: demandes.length,
        pending: demandes.filter((d: any) => d.statut === 'en_attente').length,
        accepted: demandes.filter((d: any) => d.statut === 'accepte').length,
      });
    } catch (error) {
      console.error('Error fetching employer stats:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#082151" />
      </View>
    );
  }

  const name = user?.denomination || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Recruteur';

  const avatarUri = user?.profile_image_url || user?.photo_profil || user?.avatar || user?.photo;
  const getInitials = () => {
    if (user?.prenom || user?.nom) {
      return `${(user?.prenom || '').charAt(0)}${(user?.nom || '').charAt(0)}`.toUpperCase() || 'R';
    }
    if (user?.denomination) {
      return user.denomination.substring(0, 2).toUpperCase();
    }
    return 'R';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft}
          onPress={() => router.push('/employer/profil')}
          activeOpacity={0.7}
        >
          <View style={styles.profileImagePlaceholder}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            )}
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.roleTag}>Recruteur</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push('/employer/support')}
          >
            <Ionicons name="chatbubbles-outline" size={22} color="#082151" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#082151" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#082151" />}
      >
        <LinearGradient
          colors={['#082151', '#2b4eef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons 
            name="business" 
            size={40} 
            color="rgba(255,255,255,0.2)" 
            style={styles.heroIconBackground}
          />
          <Text style={styles.heroTitle}>Aperçu de votre activité</Text>
          <Text style={styles.heroSubtitle}>Gérez vos offres et recrutez les meilleurs talents.</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Vos Statistiques</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(67, 56, 202, 0.1)' }]}>
              <Ionicons name="documents-outline" size={24} color="#4338CA" />
            </View>
            <Text style={styles.statValue}>{stats.totalMissions}</Text>
            <Text style={styles.statLabel}>Missions totales</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(21, 128, 61, 0.1)' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#15803D" />
            </View>
            <Text style={styles.statValue}>{stats.openMissions}</Text>
            <Text style={styles.statLabel}>Missions actives</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(180, 83, 9, 0.1)' }]}>
              <Ionicons name="time-outline" size={24} color="#B45309" />
            </View>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Demandes attente</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(126, 34, 206, 0.1)' }]}>
              <Ionicons name="people-outline" size={24} color="#7E22CE" />
            </View>
            <Text style={styles.statValue}>{stats.accepted}</Text>
            <Text style={styles.statLabel}>Profils acceptés</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Raccourcis</Text>

        <View style={styles.actionsList}>
          <TouchableOpacity 
            onPress={() => router.push('/missions')}
          >
            <View style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                <Ionicons name="search" size={22} color="#082151" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Gérer mes offres</Text>
                <Text style={styles.actionDesc}>Consultez ou modifiez vos annonces.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2b4eef',
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  roleTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2b4eef',
    textTransform: 'uppercase',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    padding: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#082151',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  heroIconBackground: {
    position: 'absolute',
    right: -10,
    top: -10,
    transform: [{ scale: 2.5 }],
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    width: '85%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  }
});
