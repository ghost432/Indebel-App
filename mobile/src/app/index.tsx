import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  const handleNext = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    router.push('/auth-choice');
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/auth-bg.jpg')} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(248,250,252,0.85)', '#F8FAFC']}
          locations={[0, 0.65, 0.9]}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              
              <View style={styles.header}>
                <Image 
                  source={require('../../assets/images/logo-indebel.png')} 
                  style={styles.logo} 
                  resizeMode="contain" 
                />
                <Text style={styles.subtitle}>L'excellence de la mise en relation</Text>
              </View>

              <View style={styles.mainCard}>
                <View style={styles.welcomeBadge}>
                  <Text style={styles.cardTitle}>Bienvenue ! 🎉</Text>
                </View>
                <Text style={styles.cardText}>
                  Connectez-vous à la première plateforme de prestataires et recruteurs certifiés.
                </Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.arrowButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2b4eef', '#df6422']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.arrowButtonGradient}
                    >
                      <Ionicons name="arrow-forward" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
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
  content: {
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    height: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 'auto',
  },
  logo: {
    width: 260,
    height: 100,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#df6422',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  mainCard: {
    padding: 24,
    paddingBottom: 0,
    alignItems: 'center',
  },
  welcomeBadge: {
    backgroundColor: 'rgba(223, 100, 34, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#df6422',
  },
  cardText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  arrowButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#2b4eef',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  arrowButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
