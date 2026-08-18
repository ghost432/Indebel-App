import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';
import Preloader from '../../components/Preloader';

export default function VerificationScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const userData = res.data?.data || res.data;
        setUser(userData);
      } catch (err) {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) setUser(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleUploadKyc = async () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      Alert.alert(
        "Document Soumis",
        "Votre pièce d’identité / document de statut a été transmis à l'équipe Indebel pour validation."
      );
    }, 1200);
  };

  if (loading) return <Preloader />;

  const isVerified = user?.statut_verification === 'verifie' || user?.is_verified === 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification d'Identité (KYC)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={[styles.statusBadge, isVerified ? styles.statusBadgeVerified : styles.statusBadgePending]}>
            <Ionicons name={isVerified ? "shield-checkmark" : "time-outline"} size={18} color={isVerified ? "#16A34A" : "#B45309"} />
            <Text style={[styles.statusText, isVerified ? styles.statusTextVerified : styles.statusTextPending]}>
              {isVerified ? 'Profil Vérifié' : 'En attente de vérification'}
            </Text>
          </View>

          <Text style={styles.description}>
            {isVerified 
              ? 'Votre identité prestataire a été validée. Vous pouvez postuler aux offres et recevoir des propositions directement.'
              : 'Pour garantir la confiance sur la plateforme, soumettez votre pièce d’identité (Carte d’identité / Passeport / Justificatif).'}
          </Text>

          <TouchableOpacity 
            style={[styles.uploadButton, uploading && { opacity: 0.6 }]} 
            onPress={handleUploadKyc}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload-outline" size={22} color="#df6422" style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>{uploading ? 'Téléversement...' : 'Téléverser une pièce d’identité (KYC)'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtnWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  content: { padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 20, gap: 6 },
  statusBadgeVerified: { backgroundColor: '#DCFCE7' },
  statusBadgePending: { backgroundColor: '#FEF3C7' },
  statusText: { fontWeight: '700', fontSize: 13 },
  statusTextVerified: { color: '#16A34A' },
  statusTextPending: { color: '#B45309' },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 24 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#df6422' },
  uploadButtonText: { color: '#df6422', fontWeight: '700', fontSize: 15 },
});
