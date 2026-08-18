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

export default function EmployerProfil() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
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
        console.error('Erreur chargement profil', error);
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
      return `${(user?.prenom || '').charAt(0)}${(user?.nom || '').charAt(0)}`.toUpperCase() || 'R';
    }
    if (user?.denomination) {
      return user.denomination.substring(0, 2).toUpperCase();
    }
    return 'R';
  };

  const avatarUri = user?.profile_image_url || user?.photo_profil || user?.avatar || user?.photo;
  const isVerified = user?.statut_verification === 'verifie' || user?.is_verified;

  if (loading) {
    return <Preloader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/employer')}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Mon Profil</Text>
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
          <Text style={styles.name}>{user?.denomination || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Employeur'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>Recruteur {user?.forfait_statut === 'actif' ? '• Premium' : ''}</Text>
            </View>
            <View style={[styles.verifBadge, isVerified ? styles.verifBadgeSuccess : styles.verifBadgePending]}>
              <Ionicons name={isVerified ? "shield-checkmark" : "time-outline"} size={14} color={isVerified ? "#16A34A" : "#B45309"} />
              <Text style={[styles.verifBadgeText, isVerified ? styles.verifTextSuccess : styles.verifTextPending]}>
                {isVerified ? 'Vérifié' : 'En attente'}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Cards Menu */}
        <Text style={styles.sectionHeaderTitle}>Gestion du compte</Text>
        
        <View style={styles.menuCardsContainer}>
          {/* Card 1: Account Info */}
          <TouchableOpacity style={styles.menuCard} onPress={() => setShowDetails(!showDetails)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-outline" size={22} color="#2b4eef" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Informations Personnelles</Text>
              <Text style={styles.menuSubtitle}>Consulter les détails du compte et de l'entreprise</Text>
            </View>
            <Ionicons name={showDetails ? "chevron-up" : "chevron-forward"} size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Details Accordion */}
          {showDetails && (
            <View style={styles.detailsBox}>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Entreprise / Nom</Text>
                  <Text style={styles.infoValue}>{user?.denomination || user?.nom || 'Non renseigné'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="barcode-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Numéro BCE</Text>
                  <Text style={styles.infoValue}>{user?.numero_bce || 'Non renseigné'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{user?.telephone ? `${user.indicatif || ''} ${user.telephone}`.trim() : 'Non renseigné'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>{user?.adresse || 'Non renseignée'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Card 2: Identity Verification */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/employer/verification')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#16A34A" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Vérification d'identité (BCE)</Text>
              <Text style={styles.menuSubtitle}>Statut et documents de vérification du compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 3: Subscription Plan */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/employer/forfait')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="card-outline" size={22} color="#9333EA" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Abonnement & Forfait</Text>
              <Text style={styles.menuSubtitle}>Gérer votre forfait recruteur et options</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 4: Support & Assistance */}
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/employer/support' as any)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="headset-outline" size={22} color="#D97706" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuTitle}>Centre d'Aide & Support</Text>
              <Text style={styles.menuSubtitle}>Contacter le support et vos tickets</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 5: Logout */}
          <TouchableOpacity style={[styles.menuCard, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]} onPress={() => setShowLogoutModal(true)}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Se Déconnecter</Text>
              <Text style={styles.menuSubtitle}>Fermer votre session en toute sécurité</Text>
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
  avatarContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#2b4eef' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 32, fontWeight: '900', color: '#2b4eef' },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
  email: { fontSize: 14, color: '#64748B', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roleTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  roleTagText: { color: '#2b4eef', fontSize: 12, fontWeight: '700' },
  verifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  verifBadgeSuccess: { backgroundColor: '#DCFCE7' },
  verifBadgePending: { backgroundColor: '#FEF3C7' },
  verifBadgeText: { fontSize: 12, fontWeight: '700' },
  verifTextSuccess: { color: '#16A34A' },
  verifTextPending: { color: '#B45309' },
  sectionHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  menuCardsContainer: { gap: 14 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#64748B' },
  detailsBox: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 18, marginTop: -6, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
});
