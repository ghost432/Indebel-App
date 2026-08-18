import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import BackButton from '../components/BackButton';

export default function RegisterFreelancer() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [bceVerified, setBceVerified] = useState(false);
  const [checkingBce, setCheckingBce] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [bceError, setBceError] = useState('');
  const [validationError, setValidationError] = useState('');
  const lastCheckedBce = useRef('');
  
  const [formData, setFormData] = useState({
    numero_bce: '',
    denomination: '',
    adresse: '',
    prenom: '',
    nom: '',
    telephone: '',
    mot_de_passe: '',
    confirmPassword: '',
    secteur: '',
    competences: '',
    email: '',
    role: 'freelancer'
  });

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const bceNumber = formData.numero_bce.replace(/\D/g, '');
    if (bceNumber.length < 10) {
      setBceError('');
      setValidationError('');
      setBceVerified(false);
      setServiceUnavailable(false);
      lastCheckedBce.current = '';
      return;
    }

    if (bceNumber.length === 10 && !bceVerified && !manualMode && lastCheckedBce.current !== bceNumber) {
      lastCheckedBce.current = bceNumber;
      setCheckingBce(true);
      setBceError('');
      setValidationError('');
      setServiceUnavailable(false);

      const verifyProcess = async () => {
        try {
          const checkRes = await apiClient.get(`/users/check-bce/${bceNumber}`);
          if (checkRes.data.exists) {
            setBceError('Ce numéro BCE est déjà inscrit sur la plateforme.');
            setCheckingBce(false);
            return;
          }

          const verifyRes = await apiClient.get(`/users/verify-bce/${bceNumber}`);
          if (verifyRes.data.success && verifyRes.data.data) {
            setFormData(prev => ({
              ...prev,
              denomination: verifyRes.data.data.denomination || '',
              adresse: verifyRes.data.data.adresse || ''
            }));
            setBceVerified(true);
            setBceError('');
            setServiceUnavailable(false);
          } else {
            setManualMode(true);
          }
        } catch (error: any) {
          console.error('❌ [BCE Verification] Failed:', error);
          const status = error.response?.status;
          const isUnavailable = status === 503 || error.response?.data?.serviceUnavailable;
          
          if (isUnavailable) {
            setServiceUnavailable(true);
            setBceError('Le service de vérification automatique BCE est temporairement indisponible.');
          } else if (status === 404) {
            setBceError('Ce numéro n\'est pas répertorié dans la base officielle BCE.');
          } else {
            const msg = error.response?.data?.message || 'Numéro BCE non valide ou introuvable dans la base officielle.';
            setBceError(msg);
          }
        } finally {
          setCheckingBce(false);
        }
      };

      const timer = setTimeout(() => verifyProcess(), 400);
      return () => clearTimeout(timer);
    }
  }, [formData.numero_bce, bceVerified, manualMode]);

  const handleNextStep = () => {
    setValidationError('');

    if (step === 1) {
      if (formData.numero_bce.length !== 10 && !manualMode) {
        setValidationError('Veuillez saisir un numéro BCE valide à 10 chiffres ou activer la saisie manuelle.');
        return;
      }
      if (bceError && !manualMode) {
        setValidationError(bceError);
        return;
      }
      if (!bceVerified && !manualMode) {
        setValidationError('Veuillez valider votre numéro BCE ou utiliser la saisie manuelle.');
        return;
      }
      if (manualMode && (!formData.denomination || !formData.adresse)) {
        setValidationError('Veuillez remplir la dénomination et l\'adresse de l\'entreprise.');
        return;
      }
    }

    if (step === 2) {
      if (!formData.prenom || !formData.nom || !formData.telephone) {
        setValidationError('Veuillez remplir votre prénom, nom et numéro de téléphone.');
        return;
      }
    }

    if (step === 3) {
      if (!formData.mot_de_passe || formData.mot_de_passe.length < 6) {
        setValidationError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (formData.mot_de_passe !== formData.confirmPassword) {
        setValidationError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    if (step === 4) {
      if (!formData.secteur) {
        setValidationError('Veuillez préciser votre secteur d\'activité.');
        return;
      }
    }

    if (step < 5) setStep(step + 1);
  };

  const handlePrevStep = () => {
    setValidationError('');
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setValidationError('');
    if (!formData.email || !formData.email.includes('@')) {
      setValidationError('Veuillez saisir une adresse email valide.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        email: formData.email.trim().toLowerCase(),
        mot_de_passe: formData.mot_de_passe,
        role: 'freelancer',
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        numero_bce: formData.numero_bce,
        denomination: formData.denomination,
        adresse: formData.adresse,
        secteur: formData.secteur,
        competences: formData.competences ? formData.competences.split(',').map(s => s.trim()) : []
      });

      if (response.data && response.data.success) {
        router.push({
          pathname: '/verify-otp',
          params: { 
            email: formData.email.trim().toLowerCase(),
            testOtp: response.data.data.testOtp || ''
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      const msg = error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription.';
      setValidationError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ['BCE', 'Identité', 'Sécurité', 'Activité', 'Email'];
    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <View key={index} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.activeStepCircle,
                isCompleted && styles.completedStepCircle
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepText, isActive && styles.activeStepText]}>{stepNum}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.activeStepLabel]}>{label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const isStep1Valid = bceVerified || manualMode;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#df6422" />}
        >
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.headerTitle}>Inscription Prestataire</Text>
            <View style={{ width: 40 }} />
          </View>

          {renderStepIndicator()}

          <View style={styles.formContainer}>
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Vérification BCE</Text>
                <Text style={styles.label}>Numéro d'Entreprise BCE (10 chiffres)</Text>

                <View style={[
                  styles.inputContainer, 
                  bceError ? styles.inputErrorBorder : null,
                  bceVerified && styles.inputSuccessBorder
                ]}>
                  <Ionicons 
                    name="barcode-outline" 
                    size={20} 
                    color={bceError ? "#EF4444" : bceVerified ? "#22C55E" : "#94A3B8"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 0123456789"
                    value={formData.numero_bce}
                    onChangeText={(val) => {
                      setBceError('');
                      setValidationError('');
                      if (val.length < 10) {
                        setBceVerified(false);
                        setManualMode(false);
                        setFormData(prev => ({
                          ...prev,
                          numero_bce: val,
                          denomination: '',
                          adresse: ''
                        }));
                      } else {
                        handleChange('numero_bce', val);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!bceVerified && !checkingBce}
                  />
                  {checkingBce && <ActivityIndicator size="small" color="#df6422" />}
                  {bceVerified && !checkingBce && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      <Text style={styles.verifiedBadgeText}>Vérifié</Text>
                    </View>
                  )}
                </View>

                {/* Service BCE Indisponible */}
                {serviceUnavailable && (
                  <View style={styles.warningCard}>
                    <View style={styles.warningHeader}>
                      <Ionicons name="cloud-offline-outline" size={22} color="#D97706" />
                      <Text style={styles.warningTitle}>Service BCE Indisponible</Text>
                    </View>
                    <Text style={styles.warningText}>
                      Le service de vérification automatique est temporairement indisponible. Vous pouvez saisir les informations de votre entreprise manuellement pour poursuivre votre inscription.
                    </Text>
                    {!manualMode && (
                      <TouchableOpacity 
                        style={styles.manualButtonPrimary} 
                        onPress={() => {
                          setManualMode(true);
                          setBceError('');
                          setValidationError('');
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.manualButtonPrimaryText}>Remplir les informations manuellement</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* BCE Erreur (Invalide / Déjà inscrit) */}
                {bceError && !serviceUnavailable && (
                  <View style={styles.bceErrorCard}>
                    <View style={styles.bceErrorIconBadge}>
                      <Ionicons name="alert-circle" size={22} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bceErrorTitle}>Problème de Vérification BCE</Text>
                      <Text style={styles.bceErrorText}>{bceError}</Text>
                    </View>
                  </View>
                )}

                {/* Option de Saisie Manuelle Si Non Vérifié */}
                {!bceVerified && !manualMode && !serviceUnavailable && (
                  <TouchableOpacity 
                    style={styles.manualLinkButton}
                    onPress={() => {
                      setManualMode(true);
                      setBceError('');
                      setValidationError('');
                    }}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#df6422" />
                    <Text style={styles.manualLinkText}>Saisir les informations d'entreprise manuellement</Text>
                  </TouchableOpacity>
                )}

                {/* Champs Dénomination & Adresse */}
                {(bceVerified || manualMode) && (
                  <>
                    {manualMode && (
                      <View style={styles.manualBanner}>
                        <Ionicons name="information-circle-outline" size={18} color="#082151" />
                        <Text style={styles.manualBannerText}>Mode Saisie Manuelle Actif</Text>
                      </View>
                    )}
                    <Text style={styles.label}>Dénomination de l'Entreprise</Text>
                    <View style={[styles.inputContainer, bceVerified && styles.readOnlyInput]}>
                      <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Mobilité Express SRL"
                        value={formData.denomination}
                        onChangeText={(val) => handleChange('denomination', val)}
                        editable={manualMode}
                      />
                    </View>
                    <Text style={styles.label}>Adresse du Siège Social</Text>
                    <View style={[styles.inputContainer, bceVerified && styles.readOnlyInput]}>
                      <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Rue de la Loi 100, 1000 Bruxelles"
                        value={formData.adresse}
                        onChangeText={(val) => handleChange('adresse', val)}
                        editable={manualMode}
                      />
                    </View>
                  </>
                )}
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Informations Personnelles</Text>
                <Text style={styles.label}>Prénom</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    value={formData.prenom}
                    onChangeText={(val) => handleChange('prenom', val)}
                  />
                </View>
                <Text style={styles.label}>Nom de famille</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    value={formData.nom}
                    onChangeText={(val) => handleChange('nom', val)}
                  />
                </View>
                <Text style={styles.label}>Numéro de Téléphone</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: +32 470 12 34 56"
                    value={formData.telephone}
                    onChangeText={(val) => handleChange('telephone', val)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Sécurité du Compte</Text>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Au moins 6 caractères"
                    secureTextEntry={!showPassword}
                    value={formData.mot_de_passe}
                    onChangeText={(val) => handleChange('mot_de_passe', val)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Répéter le mot de passe"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(val) => handleChange('confirmPassword', val)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Secteur et Compétences</Text>
                <Text style={styles.label}>Secteur d'activité</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="briefcase-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Transport, Logistique, Construction"
                    value={formData.secteur}
                    onChangeText={(val) => handleChange('secteur', val)}
                  />
                </View>
                <Text style={styles.label}>Compétences (optionnel)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="construct-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Permis C, Chauffeur, Électricien"
                    value={formData.competences}
                    onChangeText={(val) => handleChange('competences', val)}
                  />
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Adresse Email</Text>
                <Text style={styles.label}>Email Professionnel</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre.email@domaine.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => handleChange('email', val)}
                  />
                </View>
              </View>
            )}

            {/* Bannière de Validation stylisée en cas d'erreur */}
            {validationError ? (
              <View style={styles.validationErrorBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.validationErrorText}>{validationError}</Text>
              </View>
            ) : null}

            <View style={styles.buttonContainer}>
              {step > 1 && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevStep}>
                  <Text style={styles.secondaryButtonText}>Précédent</Text>
                </TouchableOpacity>
              )}

              {step < 5 ? (
                isStep1Valid || step > 1 ? (
                  <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
                    <Text style={styles.primaryButtonText}>Suivant</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.disabledStepButton} onPress={handleNextStep}>
                    <Text style={styles.disabledStepButtonText}>Valider l'étape pour continuer</Text>
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Créer mon compte</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  stepIndicatorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingHorizontal: 8 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  activeStepCircle: { backgroundColor: '#df6422' },
  completedStepCircle: { backgroundColor: '#22C55E' },
  stepText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  activeStepText: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  activeStepLabel: { color: '#df6422', fontWeight: '700' },
  formContainer: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  stepContent: { gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  inputErrorBorder: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  inputSuccessBorder: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  readOnlyInput: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0F172A' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verifiedBadgeText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  warningCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 16, gap: 10, marginTop: 4 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontSize: 15, fontWeight: '800', color: '#92400E' },
  warningText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  manualButtonPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#df6422', paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  manualButtonPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  bceErrorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 16, padding: 14, marginTop: 4, gap: 12 },
  bceErrorIconBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  bceErrorTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  bceErrorText: { fontSize: 13, color: '#B91C1C', marginTop: 2, lineHeight: 18 },
  manualLinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  manualLinkText: { fontSize: 13, fontWeight: '700', color: '#df6422', textDecorationLine: 'underline' },
  manualBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 12, borderRadius: 14 },
  manualBannerText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  validationErrorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', padding: 12, borderRadius: 14, marginTop: 16 },
  validationErrorText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#991B1B' },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  primaryButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#df6422', paddingVertical: 16, borderRadius: 16, shadowColor: '#df6422', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  disabledStepButton: { flex: 1, backgroundColor: '#E2E8F0', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  disabledStepButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#475569', fontSize: 16, fontWeight: '700' },
});
