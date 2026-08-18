import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../api/client';
import Preloader from '../../../components/Preloader';

export default function FreelancerDevisDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [devis, setDevis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevisDetail = async () => {
      try {
        const response = await apiClient.get(`/devis/mes-demandes`);
        if (response.data && response.data.data) {
          // Dev trick: we fetch the list again and filter, or use a specific detail endpoint
          // Since often there's no single devis endpoint for the mobile app yet, we extract it:
          const found = response.data.data.find((d: any) => String(d.id) === String(id));
          if (found) {
            setDevis(found);
          } else {
            // Attempt an explicit fetch if the endpoint exists
            try {
               const detailResp = await apiClient.get(`/devis/${id}`);
               if (detailResp.data && detailResp.data.data) setDevis(detailResp.data.data);
            } catch(e) {
               // Ignore
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement détail devis', error);
        Alert.alert('Erreur', 'Impossible de charger ce devis.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDevisDetail();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) return <Preloader />;

  if (!devis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail introuvable</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ce devis n'existe plus ou est inaccessible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isRejected = devis.statut === 'refuse' || devis.status === 'Refusé';
  const isAccepted = devis.statut === 'valide' || devis.status === 'Accepté';
  const statusText = isAccepted ? 'Validé' : (isRejected ? 'Refusé' : devis.statut || 'En attente');
  const dateStr = devis.date_creation || devis.created_at;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Date inconnue';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Devis</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{devis.titre || devis.titre_projet || devis.title || 'Projet sans titre'}</Text>
          </View>

          <View style={[styles.statusBadge, isRejected ? styles.statusRejected : (isAccepted ? styles.statusAccepted : styles.statusPending), { alignSelf: 'flex-start', marginBottom: 16 }]}>
            <Text style={[styles.statusText, isRejected ? styles.statusTextRejected : (isAccepted ? styles.statusTextAccepted : styles.statusTextPending)]}>{statusText}</Text>
          </View>
          
          <View style={styles.clientInfo}>
            <Ionicons name="business-outline" size={18} color="#64748B" />
            <Text style={styles.clientText}>{devis.entreprise || devis.nom_entreprise || devis.client || 'Client inconnu'}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description détaillée</Text>
            <Text style={styles.description}>{devis.description || devis.message || 'Aucune description fournie.'}</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={20} color="#df6422" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Montant / Budget</Text>
                <Text style={styles.detailValue}>{devis.montant || devis.budget ? `${devis.montant || devis.budget}€` : 'Non précisé'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#df6422" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date de demande</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusAccepted: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextRejected: { color: '#EF4444' },
  statusTextAccepted: { color: '#16A34A' },
  statusTextPending: { color: '#B45309' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  clientText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  section: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24 },
  detailsGrid: { marginTop: 24, gap: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center' }
});
