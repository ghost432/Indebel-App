import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import PremiumBackground from '../components/PremiumBackground';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBaseURL, setCurrentBaseURL] = useState(apiClient.defaults.baseURL);

  useEffect(() => {
    const loadSavedURL = async () => {
      const saved = await AsyncStorage.getItem('saved_api_url');
      if (saved) {
        apiClient.defaults.baseURL = saved;
        setCurrentBaseURL(saved);
      } else {
        setCurrentBaseURL(apiClient.defaults.baseURL);
      }
    };
    loadSavedURL();
  }, []);

  const getServerLabel = (url: string | undefined) => {
    if (!url) return 'Non défini';
    if (url.includes('pro.indebel.be')) return '🟢 Production';
    if (url.includes('192.168.105.56')) return '💻 Local (Réseau)';
    if (url.includes('localhost') || url.includes('10.0.2.2')) return '📱 Simulateur / Émulateur';
    return '🔗 Personnalisé';
  };

  const toggleServer = async () => {
    const prodURL = 'https://pro.indebel.be/api';
    const localPCURL = 'http://192.168.105.56:5000/api';
    const localSimURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
    
    let nextURL = prodURL;
    const current = currentBaseURL || '';

    if (current.includes('pro.indebel.be')) {
      nextURL = localPCURL;
    } else if (current.includes('192.168.105.56')) {
      nextURL = localSimURL;
    } else {
      nextURL = prodURL;
    }

    apiClient.defaults.baseURL = nextURL;
    setCurrentBaseURL(nextURL);
    await AsyncStorage.setItem('saved_api_url', nextURL);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // You can reset states or clear errors here if needed
    setError('');
    setEmail('');
    setPassword('');
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔑 [Login] Attempting login. Base URL:', apiClient.defaults.baseURL);
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        mot_de_passe: password
      });

      if (response.data && response.data.success) {
        if (response.data.data.requiresOTP) {
          router.push({
            pathname: '/verify-otp',
            params: { 
              email: response.data.data.email,
              testOtp: response.data.data.testOtp || ''
            }
          });
        } else {
          await AsyncStorage.setItem('userToken', response.data.data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
          
          const userRole = response.data.data.user.role;
          const userEmail = response.data.data.user.email;
          
          if (userRole === 'admin' || userEmail === 'noreply@indebel.be') {
            router.replace('/admin');
          } else if (userRole === 'employer') {
            router.replace('/employer');
          } else {
            router.replace('/freelancer');
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur Login:', err.response?.data || err.message);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else {
        const requestUrl = apiClient.defaults.baseURL || 'non définie';
        setError(`Erreur de connexion (${err.message || 'Serveur inaccessible'}). Veuillez vérifier votre réseau.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2b4eef" />
          }
        >
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/splash-icon.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>Connectez-vous pour accéder à votre compte Indebel</Text>
          </View>

          <View style={styles.glassFormContainer}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#2b4eef" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#2b4eef" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#2b4eef" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password' as any)}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Server Selector for Developers / Testing */}
            <View style={styles.serverSelectorContainer}>
              <Text style={styles.serverLabel}>{getServerLabel(currentBaseURL)}</Text>
              <Text style={styles.serverValue} numberOfLines={1}>{currentBaseURL}</Text>
              <TouchableOpacity style={styles.serverButton} onPress={toggleServer}>
                <Ionicons name="swap-horizontal" size={14} color="#2b4eef" style={{ marginRight: 4 }} />
                <Text style={styles.serverButtonText}>Changer de serveur</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Nouveau sur Indebel ? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2b4eef',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  glassFormContainer: {
    width: '100%',
    marginTop: 40,
    paddingVertical: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(254, 202, 202, 0.9)',
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 10,
    marginLeft: -10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#2b4eef',
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#2b4eef',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2b4eef',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  registerText: {
    color: '#64748B',
    fontSize: 15,
  },
  registerLink: {
    color: '#df6422',
    fontSize: 15,
    fontWeight: 'bold',
  },
  serverSelectorContainer: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    alignItems: 'center',
  },
  serverLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  serverValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF3FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  serverButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b4eef',
  },
});
