import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForfaitScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="star" size={22} color="#fff" />
          <Text style={styles.headerTitle}>Mon Forfait</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Forfait Gratuit</Text>
            <Text style={styles.planPrice}>0€<Text style={styles.planPricePeriod}>/mois</Text></Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Profil public basique</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Réponse à 3 devis par mois</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.featureText}>Pas de mise en avant</Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeText}>Passer en Premium ⭐</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#df6422',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 8 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  planName: { fontSize: 20, fontWeight: '700', color: '#334155' },
  planPrice: { fontSize: 24, fontWeight: '800', color: '#2b4eef' },
  planPricePeriod: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 15, color: '#475569', marginLeft: 12 },
  upgradeButton: {
    marginTop: 16,
    backgroundColor: '#df6422',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
