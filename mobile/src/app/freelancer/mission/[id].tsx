import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../api/client';
import Preloader from '../../../components/Preloader';

export default function MissionDetail() {
  const router = useRouter();
  const { id, type, source } = useLocalSearchParams();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchMissionDetail = async () => {
      try {
        const response = await apiClient.get(`/missions/public/${type}/${id}?source=${source || ''}`);
        if (response.data && response.data.data) {
          setMission(response.data.data);
        }
      } catch (error) {
        console.error('Erreur chargement détail mission', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de cette mission.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id && type) {
      fetchMissionDetail();
    } else {
      setLoading(false);
    }
  }, [id, type, source]);

  const handleApply = async () => {
    setApplying(true);
    try {
      // Endpoint depends on your backend structure. Assuming /applications/apply
      const response = await apiClient.post('/applications', {
        mission_id: id,
        mission_type: type
      });
      if (response.data?.success) {
        Alert.alert('Succès', 'Votre candidature a été envoyée avec succès.');
        router.back();
      }
    } catch (error: any) {
      console.error('Erreur candidature', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue lors de la candidature.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Preloader />;

  if (!mission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail introuvable</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>La mission n'existe plus ou n'est plus disponible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = mission.date_creation || mission.created_at;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Date inconnue';
  const competences = typeof mission.competences === 'string' ? JSON.parse(mission.competences || '[]') : mission.competences;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la mission</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{mission.titre || mission.title}</Text>
          
          <View style={styles.companyInfo}>
            <Ionicons name="business-outline" size={18} color="#64748B" />
            <Text style={styles.companyText}>
              {mission.denomination || mission.entreprise || 'Entreprise'}
            </Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {mission.urgente ? (
              <View style={[styles.tag, styles.tagUrgent]}>
                <Ionicons name="flash-outline" size={12} color="#EF4444" />
                <Text style={styles.tagTextUrgent}>Urgente</Text>
              </View>
            ) : null}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{mission.categorie || mission.secteur || 'Secteur non défini'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{mission.description}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={20} color="#2b4eef" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Budget / Tarif</Text>
                <Text style={styles.detailValue}>
                  {mission.forfait_heure ? `${mission.forfait_heure}€/h` : ''}
                  {mission.forfait_mission ? `${mission.forfait_mission}€` : ''}
                  {mission.budget_projet ? `${mission.budget_projet}€` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={20} color="#2b4eef" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Lieu</Text>
                <Text style={styles.detailValue}>
                  {mission.ville_mission || mission.adresse_mission || 'À distance'}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#2b4eef" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Publiée le</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {competences && competences.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compétences requises</Text>
              <View style={styles.competencesContainer}>
                {Array.isArray(competences) ? competences.map((comp: string, index: number) => (
                  <View key={index} style={styles.competenceBadge}>
                    <Text style={styles.competenceText}>{comp}</Text>
                  </View>
                )) : <Text style={styles.description}>{competences}</Text>}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.applyButton} 
          onPress={handleApply}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Postuler à cette mission</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { padding: 8, marginLeft: -8, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginLeft: 12 },
  content: { padding: 24 },
  card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  companyInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  companyText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  tagUrgent: { backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagTextUrgent: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  section: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24 },
  detailsGrid: { marginTop: 24, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  competencesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  competenceBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  competenceText: { color: '#4338CA', fontSize: 14, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center' },
  footer: { padding: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  applyButton: { backgroundColor: '#df6422', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#df6422', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
