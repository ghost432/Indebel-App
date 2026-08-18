import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
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
  const [bceInput, setBceInput] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const userData = res.data?.data || res.data;
        setUser(userData);
        if (userData?.numero_bce) setBceInput(userData.numero_bce);
      } catch (err) {
        const stored = await AsyncStorage.getItem('userData');
        if (stored) setUser(JSON.parse(stored));
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleVerifyBce = async () => {
    if (!bceInput.trim()) {
      Alert.alert("BCE requis", "Veuillez saisir votre numéro BCE.");
      return;
    }
    setChecking(true);
    try {
      const res = await apiClient.get(`/users/check-bce/${bceInput.trim()}`);
      if (res.data?.success) {
        Alert.alert("BCE Valide", `Entreprise: ${res.data.data?.denomination || 'Trouvée'}`);
      } else {
        Alert.alert("Information BCE", "Demande de vérification transmise à l'administrateur.");
      }
    } catch (err) {
      Alert.alert("Vérification envoyée", "Votre numéro BCE a été soumis pour validation.");
    } finally {
      setChecking(false);
    }
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
        <Text style={styles.headerTitle}>Vérification d'Identité & BCE</Text>
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
              ? 'Votre entreprise est légalement vérifiée par numéro BCE. Vous bénéficiez d’un accès complet à la publication de missions et au recrutement.'
              : 'Saisissez votre numéro d’entreprise BCE ci-dessous pour valider votre compte recruteur et publier des missions.'}
          </Text>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Numéro d'Entreprise BCE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0123.456.789"
              value={bceInput}
              onChangeText={setBceInput}
            />
          </View>

          <TouchableOpacity 
            style={[styles.uploadButton, checking && { opacity: 0.6 }]} 
            onPress={handleVerifyBce}
            disabled={checking}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#2b4eef" style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>{checking ? 'Vérification...' : 'Soumettre le numéro BCE'}</Text>
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
  inputBox: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 15, color: '#0F172A' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#2b4eef' },
  uploadButtonText: { color: '#2b4eef', fontWeight: '700', fontSize: 15 },
});
