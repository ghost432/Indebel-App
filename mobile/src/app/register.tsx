import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../components/BackButton';
import PremiumBackground from '../components/PremiumBackground';

export default function Register() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4eef" />}
        >
          <BackButton />

        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/splash-icon.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.title}>Rejoignez Indebel</Text>
          <Text style={styles.subtitle}>Sélectionnez votre profil pour commencer l'aventure</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Card Freelancer */}
          <Pressable 
            onPress={() => router.push('/register-freelancer')}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed
            ]}
          >
            <View style={styles.iconWrapperBlue}>
              <Ionicons name="briefcase" size={24} color="#2b4eef" />
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.itemTitle}>Je suis un Prestataire</Text>
              <Text style={styles.itemDescription}>
                Trouvez des missions adaptées à vos compétences et développez votre activité.
              </Text>
            </View>
            <View style={styles.arrowCircleBlue}>
              <Ionicons name="chevron-forward" size={18} color="#2b4eef" />
            </View>
          </Pressable>

          {/* Card Employer */}
          <Pressable 
            onPress={() => router.push('/register-employer')}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed
            ]}
          >
            <View style={styles.iconWrapperOrange}>
              <Ionicons name="business" size={24} color="#df6422" />
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.itemTitle}>Je suis un Recruteur</Text>
              <Text style={styles.itemDescription}>
                Publiez vos besoins de services et trouvez des talents qualifiés.
              </Text>
            </View>
            <View style={styles.arrowCircleOrange}>
              <Ionicons name="chevron-forward" size={18} color="#df6422" />
            </View>
          </Pressable>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2b4eef',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    transform: [{ scale: 0.98 }],
  },
  iconWrapperBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconWrapperOrange: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  arrowCircleBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF3FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arrowCircleOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  loginText: {
    color: '#64748B',
    fontSize: 15,
  },
  loginLink: {
    color: '#2b4eef',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
