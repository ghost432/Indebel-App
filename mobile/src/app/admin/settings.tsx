import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutModal from '../../components/LogoutModal';

export default function AdminSettings() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres Admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Mon Compte Admin</Text>
          <TouchableOpacity style={styles.profileLinkCard} onPress={() => router.push('/admin/profil' as any)}>
            <View style={styles.profileLinkIconBox}>
              <Ionicons name="person-circle-outline" size={26} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileLinkTitle}>Mon Profil Administrateur</Text>
              <Text style={styles.profileLinkSubtitle}>Consulter et gérer les informations du compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Plateforme</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle-outline" size={20} color="#64748B" />
                <Text style={styles.rowLabel}>Version de l'application</Text>
              </View>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="cloud-done-outline" size={20} color="#16A34A" />
                <Text style={styles.rowLabel}>Statut du serveur</Text>
              </View>
              <Text style={[styles.rowValue, { color: '#16A34A', fontWeight: '700' }]}>En ligne (145.223.33.208)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Session</Text>
          <TouchableOpacity style={styles.logoutCard} onPress={() => setShowLogoutModal(true)}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter de l'administration</Text>
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
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { padding: 24, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileLinkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 20, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  profileLinkIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  profileLinkTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  profileLinkSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  rowValue: { fontSize: 14, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  logoutCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 20, padding: 16 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
