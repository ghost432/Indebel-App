import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ImageBackground, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../components/BackButton';

const { width, height } = Dimensions.get('window');

export default function AuthChoice() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/welcome-bg.jpg')} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(248,250,252,0.85)', '#F8FAFC']}
          locations={[0, 0.65, 0.9]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4eef" />}
            >
            <View style={styles.header}>
              <BackButton />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>Commencez votre aventure</Text>
          <Text style={styles.subtitle}>
            Rejoignez la communauté Indebel pour trouver vos prochaines opportunités.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
            </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    padding: 24,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2b4eef',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#2b4eef',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2b4eef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#df6422',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#df6422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
