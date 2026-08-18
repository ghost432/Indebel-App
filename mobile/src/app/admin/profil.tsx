import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';
import LogoutModal from '../../components/LogoutModal';

export default function AdminProfil() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get('/users/profile');
        if (response.data && response.data.data) {
          setUser(response.data.data);
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error('Erreur chargement profil admin', error);
        const userData = await AsyncStorage.getItem('userData');
        if (userData) setUser(JSON.parse(userData));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    router.replace('/login');
  };

  const getInitials = () => {
    if (user?.prenom || user?.nom) {
      return `${(user?.prenom || '').charAt(0)}${(user?.nom || '').charAt(0)}`.toUpperCase() || 'AD';
    }
    return 'AD';
  };

  const avatarUri = user?.profile_image_url || user?.photo_profil || user?.avatar || user?.photo;

  if (loading) {
    return <Preloader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/admin')}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Profil Administrateur</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            )}
          </View>
          <Text style={styles.name}>{`${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email || 'Administrateur'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Ionicons name="shield-checkmark" size={14} color="#7C3AED" style={{ marginRight: 4 }} />
              <Text style={styles.roleTagText}>Super Administrateur</Text>
            </View>
          </View>
        </View>

        {/* Navigation Cards Menu */}
        <Text style={styles.sectionHeaderTitle}>Paramètres du compte Admin</Text>
        
        <View style={styles.menuCardsContainer}>
          {/* Card 1: System Settings */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/settings')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="settings-outline" size={22} color="#7C3AED" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Paramètres de la Plateforme</Text>
              <Text style={styles.menuSubtitle}>Configuration générale du système</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 2: User Verifications */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/verifications' as any)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#16A34A" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Vérifications d'Identité (BCE/KYC)</Text>
              <Text style={styles.menuSubtitle}>Valider ou refuser les comptes en attente</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 3: Support & Tickets */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/admin/tickets' as any)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="headset-outline" size={22} color="#2563EB" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Tickets Support & Aide</Text>
              <Text style={styles.menuSubtitle}>Répondre aux demandes des utilisateurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 4: Logout */}
          <TouchableOpacity style={[styles.menuCard, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]} onPress={() => setShowLogoutModal(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Se Déconnecter</Text>
              <Text style={styles.menuSubtitle}>Fermer la session Administrateur</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <LogoutModal 
        visible={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 8, marginLeft: -8, borderRadius: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { padding: 24 },
  profileCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#7C3AED' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#7C3AED' },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  email: { fontSize: 14, color: '#64748B', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roleTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  roleTagText: { color: '#7C3AED', fontSize: 12, fontWeight: '700' },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  menuCardsContainer: { gap: 14 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#64748B' },
});
