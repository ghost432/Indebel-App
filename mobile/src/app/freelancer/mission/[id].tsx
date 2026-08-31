import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../api/client';
import Preloader from '../../../components/Preloader';

export default function MissionDetailModal() {
  const router = useRouter();
  const { id, type, source } = useLocalSearchParams();
  const [mission, setMission] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);

  const [appliedApplication, setAppliedApplication] = useState<any>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Identity & Image Zoom Modals
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [showApplySuccessModal, setShowApplySuccessModal] = useState(false);

  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/freelancer/missions');
      }
    }, 50);
  };

  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [coutPostulations, setCoutPostulations] = useState<number>(1);

  useEffect(() => {
    setModalVisible(true);
    const fetchUserAndMission = async () => {
      if (!id || id === 'undefined') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        let fetchedMission = null;

        // Fetch profile, credit balance, and settings
        Promise.all([
          apiClient.get('/auth/me').catch(() => ({ data: {} })),
          apiClient.get('/credits/balance').catch(() => ({ data: {} })),
          apiClient.get('/credits/settings/price').catch(() => apiClient.get('/admin-credits/settings/price')).catch(() => ({ data: {} }))
        ]).then(([userRes, balanceRes, settingsRes]) => {
          const userObj = userRes.data?.user || userRes.data?.data || userRes.data || null;
          if (userObj) {
            setUserProfile(userObj);
            if (typeof userObj.solde_credits === 'number') {
              setCreditBalance(userObj.solde_credits);
            }
          }
          if (balanceRes.data?.solde !== undefined) {
            setCreditBalance(parseInt(balanceRes.data.solde, 10));
          }
          if (settingsRes.data?.cout_postulations !== undefined) {
            setCoutPostulations(parseInt(settingsRes.data.cout_postulations, 10));
          }
        }).catch(() => {});

        const missionTypeParam = (type as string) || 'hourly';
        let response = await apiClient.get(`/missions/public/${missionTypeParam}/${id}?source=${source || ''}`).catch(() => null);

        if (!response || !response.data || (!response.data.data && !response.data.id)) {
          const alternateType = missionTypeParam === 'fixed' ? 'hourly' : 'fixed';
          response = await apiClient.get(`/missions/public/${alternateType}/${id}?source=${source || ''}`).catch(() => null);
        }

        if (response && response.data && (response.data.data || response.data)) {
          fetchedMission = response.data.data || response.data;
          setMission(fetchedMission);
        }

        // Check if user already applied
        try {
          const myAppsRes = await apiClient.get('/applications/my-applications');
          if (myAppsRes.data && Array.isArray(myAppsRes.data.data || myAppsRes.data)) {
            const items = myAppsRes.data.data || myAppsRes.data;
            const found = items.find((app: any) => String(app.job_id || app.id) === String(id));
            if (found) {
              setHasApplied(true);
              setAppliedApplication(found);

              // Fallback: If public mission endpoint returned empty/null, populate mission from application data
              if (!fetchedMission) {
                setMission({
                  id: found.job_id || found.id,
                  titre: found.job_titre || 'Mission postulée',
                  description: found.job_description || 'Aucune description spécifique.',
                  denomination: found.employer_denomination || found.employer_nom || 'Client Indebel',
                  nom: found.employer_nom,
                  statut: found.statut
                });
              }
            }
          }
        } catch (e) {
          // Ignore
        }
      } catch (error) {
        console.error('Erreur chargement détail mission:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchUserAndMission();
    } else {
      setLoading(false);
    }
  }, [id, type, source]);

  const checkIdentityVerification = () => {
    if (!userProfile) return true;
    const isVerified = Boolean(
      userProfile.kyc_verified ||
      userProfile.identity_verified ||
      userProfile.is_verified === 1 ||
      userProfile.is_verified === true ||
      userProfile.statut_verification === 'verifie' ||
      userProfile.statut_verification === 'approuve' ||
      userProfile.verification_identite_status === 'verification_identite_verifier' ||
      userProfile.verification_identite_status === 'verifie' ||
      userProfile.statut_kyc === 'approuve' ||
      userProfile.statut_kyc === 'verifie' ||
      userProfile.status_kyc === 'approved' ||
      userProfile.statut === 'verifie' ||
      userProfile.verified === true ||
      userProfile.bce_verifie === 1 ||
      userProfile.bce_verifie === true
    );

    if (!isVerified) {
      setKycModalVisible(true);
      return false;
    }
    return true;
  };

  const handleApply = () => {
    if (!checkIdentityVerification()) return;

    if (creditBalance < coutPostulations) {
      Alert.alert(
        'Crédits Insuffisants ⚠️',
        `Postuler à une mission nécessite ${coutPostulations} crédit(s). Votre solde actuel est de ${creditBalance} crédit(s). Souhaitez-vous recharger ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Recharger', onPress: () => { handleClose(); router.push('/freelancer/credits'); } }
        ]
      );
      return;
    }

    setNoteText('');
    setNoteModalVisible(true);
  };

  const submitApplication = async () => {
    setApplying(true);
    try {
      const response = await apiClient.post('/applications', {
        job_id: Number(id),
        mission_type: type || 'hourly',
        message: noteText.trim()
      });

      if (response.data?.success) {
        setHasApplied(true);
        setAppliedApplication({
          statut: 'en_attente',
          message: noteText.trim()
        });
        setCreditBalance(prev => Math.max(0, prev - coutPostulations));
        setNoteModalVisible(false);
        setShowApplySuccessModal(true);
      }
    } catch (error: any) {
      console.error('Erreur candidature:', error);
      const msg = error.response?.data?.message || 'Une erreur est survenue lors de la candidature.';
      if (msg.includes('déjà postulé')) {
        setHasApplied(true);
      }
      Alert.alert('Candidature', msg);
    } finally {
      setApplying(false);
    }
  };

  let competences: any[] = [];
  try {
    const rawComp = mission?.competences_requises || mission?.competences;
    if (typeof rawComp === 'string') {
      competences = JSON.parse(rawComp);
    } else if (Array.isArray(rawComp)) {
      competences = rawComp;
    }
  } catch (e) {
    competences = [];
  }

  const budgetDisplay = mission?.forfait_heure 
    ? `${mission.forfait_heure} €/h` 
    : (mission?.taux_horaire ? `${mission.taux_horaire} €/h` : (mission?.budget_projet ? `${mission.budget_projet} €` : (mission?.budget_fixe ? `${mission.budget_fixe} €` : 'À discuter')));

  if (!modalVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Touch backdrop to close */}
        <TouchableOpacity 
          style={styles.backdropTouch} 
          activeOpacity={1} 
          onPress={handleClose} 
        />

        {/* Bottom Sheet Popup Container */}
        <View style={styles.sheetContainer}>
          {/* Top Handle bar */}
          <TouchableOpacity style={styles.handleBarContainer} onPress={handleClose} activeOpacity={0.8}>
            <View style={styles.handleBar} />
          </TouchableOpacity>

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>Offre de mission</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {mission?.titre || mission?.title || 'Détails de la mission'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.6}
            >
              <Ionicons name="close-circle" size={32} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <Preloader />
            </View>
          ) : !mission ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Mission introuvable</Text>
              <Text style={styles.emptyText}>La mission demandée n'existe plus ou est expirée.</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  {mission.urgente ? (
                    <View style={styles.badgeUrgent}>
                      <Ionicons name="flash" size={14} color="#EF4444" />
                      <Text style={styles.badgeUrgentText}>Urgente</Text>
                    </View>
                  ) : null}

                  <View style={styles.badgeCategory}>
                    <Text style={styles.badgeCategoryText}>
                      {mission.categorie || mission.secteur || 'Général'}
                    </Text>
                  </View>

                  <View style={styles.badgeType}>
                    <Text style={styles.badgeTypeText}>
                      {mission.type_facturation === 'forfait_fixe' || mission.mission_type === 'fixed' ? 'Forfait Fixe' : 'Taux Horaire'}
                    </Text>
                  </View>
                </View>

                {/* Employer Profile Card */}
                <View style={styles.employerProfileCard}>
                  {mission.logo || mission.photo || mission.avatar || mission.employer_photo ? (
                    <TouchableOpacity onPress={() => setZoomImageUrl(mission.logo || mission.photo || mission.avatar || mission.employer_photo)}>
                      <Image 
                        source={{ uri: mission.logo || mission.photo || mission.avatar || mission.employer_photo }} 
                        style={styles.employerAvatarImg} 
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.employerAvatarBadge}>
                      <Text style={styles.employerAvatarText}>
                        {((mission.denomination || mission.entreprise || mission.prenom || 'E')[0]).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.employerRoleLabel}>Entreprise / Employeur</Text>
                    <Text style={styles.employerFullName}>
                      {mission.denomination || mission.entreprise || `${mission.prenom || ''} ${mission.nom || ''}`.trim() || 'Employeur Indebel'}
                    </Text>
                    {Boolean((mission.prenom || mission.nom) && (mission.denomination || mission.entreprise)) && (
                      <Text style={styles.employerContactPerson}>
                        Contact : {mission.prenom || ''} {mission.nom || ''}
                      </Text>
                    )}
                    {Boolean(mission.email || mission.telephone) && (
                      <View style={styles.employerContactDetailsRow}>
                        {mission.email ? (
                          <Text style={styles.employerContactText}>✉️ {mission.email}</Text>
                        ) : null}
                        {mission.telephone ? (
                          <Text style={styles.employerContactText}>📞 {mission.telephone}</Text>
                        ) : null}
                      </View>
                    )}
                    <View style={styles.employerMetaRow}>
                      <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
                      <Text style={styles.employerVerifiedText}>Entreprise Vérifiée Indebel</Text>
                    </View>
                  </View>
                </View>

                {/* Info Card Grid */}
                <View style={styles.infoCard}>
                  <View style={styles.infoGridItem}>
                    <Ionicons name="cash-outline" size={22} color="#2b4eef" />
                    <View>
                      <Text style={styles.infoLabel}>Rémunération / Budget</Text>
                      <Text style={styles.infoValue}>{budgetDisplay}</Text>
                    </View>
                  </View>

                  <View style={styles.infoGridItem}>
                    <Ionicons name="location-outline" size={22} color="#2b4eef" />
                    <View>
                      <Text style={styles.infoLabel}>Lieu d'intervention</Text>
                      <Text style={styles.infoValue}>
                        {mission.ville_mission || mission.localisation || mission.adresse_mission || 'À distance / Belgique'}
                      </Text>
                    </View>
                  </View>

                  {mission.date_debut ? (
                    <View style={styles.infoGridItem}>
                      <Ionicons name="calendar-outline" size={22} color="#2b4eef" />
                      <View>
                        <Text style={styles.infoLabel}>Date de démarrage</Text>
                        <Text style={styles.infoValue}>
                          {new Date(mission.date_debut).toLocaleDateString('fr-BE')}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description de la mission</Text>
                  <Text style={styles.descriptionText}>
                    {mission.description || 'Aucune description détaillée fournie.'}
                  </Text>
                </View>

                {/* Competences Required */}
                {competences && Array.isArray(competences) && competences.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Compétences requises</Text>
                    <View style={styles.competencesContainer}>
                      {competences.map((comp: string, idx: number) => (
                        <View key={idx} style={styles.competenceBadge}>
                          <Text style={styles.competenceText}>{comp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={{ height: 110 }} />
              </ScrollView>

              {/* Bottom Sticky Action Footer */}
              <View style={styles.footerAction}>
                {hasApplied ? (
                  <View style={{ width: '100%', padding: 14, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#166534' }}>Candidature transmise</Text>
                        <Text style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
                          Statut : {appliedApplication?.statut === 'accepte' ? 'Acceptée 🎉' : appliedApplication?.statut === 'refuse' ? 'Refusée' : 'En attente de réponse'}
                        </Text>
                      </View>
                    </View>
                    {appliedApplication?.message ? (
                      <View style={{ marginTop: 10, padding: 10, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D', marginBottom: 2 }}>Note / Message au recruteur :</Text>
                        <Text style={{ fontSize: 13, color: '#166534', fontStyle: 'italic' }}>"{appliedApplication.message}"</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ width: '100%' }}>
                    <View style={styles.creditInfoRow}>
                      <Text style={styles.creditInfoText}>
                        Coût postulation : <Text style={{ fontWeight: '800', color: '#2563EB' }}>{coutPostulations} crédit(s)</Text>
                      </Text>
                      <Text style={styles.creditInfoText}>
                        Solde : <Text style={{ fontWeight: '800', color: creditBalance >= coutPostulations ? '#16A34A' : '#EF4444' }}>{creditBalance} cr.</Text>
                      </Text>
                    </View>

                    {creditBalance < coutPostulations && (
                      <View style={styles.insufficientBox}>
                        <Ionicons name="warning-outline" size={18} color="#DC2626" />
                        <Text style={styles.insufficientText}>
                          Solde insuffisant pour postuler ({creditBalance} / {coutPostulations} cr.).
                        </Text>
                        <TouchableOpacity
                          style={styles.rechargeBtnModal}
                          onPress={() => { handleClose(); router.push('/freelancer/credits'); }}
                        >
                          <Text style={styles.rechargeBtnModalText}>Recharger mes crédits</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.applyBtn, creditBalance < coutPostulations && { opacity: 0.5 }]} 
                      onPress={handleApply}
                      disabled={applying || creditBalance < coutPostulations}
                    >
                      {applying ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.applyBtnText}>Postuler à cette mission</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Identity Verification KYC Modal */}
      <Modal
        visible={kycModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setKycModalVisible(false)}
      >
        <View style={styles.kycOverlay}>
          <View style={styles.kycCard}>
            <View style={styles.kycHeaderIconBadge}>
              <Ionicons name="shield-outline" size={32} color="#DC2626" />
            </View>
            <Text style={styles.kycTitle}>Vérification d'identité requise 🛡️</Text>
            <Text style={styles.kycSubtitle}>Profil non vérifié</Text>
            <Text style={styles.kycText}>
              Pour pouvoir postuler à cette mission ou envoyer des offres sur Indebel, vous devez faire vérifier votre identité dans votre profil.
            </Text>
            <View style={styles.kycActionsRow}>
              <TouchableOpacity 
                style={styles.kycCancelBtn}
                onPress={() => setKycModalVisible(false)}
              >
                <Text style={styles.kycCancelText}>Plus tard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.kycConfirmBtn}
                onPress={() => {
                  setKycModalVisible(false);
                  handleClose();
                  router.push('/freelancer/profile' as any);
                }}
              >
                <Text style={styles.kycConfirmText}>Vérifier mon identité</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        visible={Boolean(zoomImageUrl)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setZoomImageUrl(null)}
      >
        <View style={styles.zoomOverlay}>
          <TouchableOpacity 
            style={styles.zoomCloseBtn} 
            onPress={() => setZoomImageUrl(null)}
          >
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {zoomImageUrl ? (
            <Image 
              source={{ uri: zoomImageUrl }} 
              style={styles.zoomImageFull} 
              resizeMode="contain" 
            />
          ) : null}
        </View>
      </Modal>

      {/* SUPPLEMENTARY NOTE INPUT MODAL */}
      <Modal
        visible={noteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.relookModalOverlay}>
          <View style={styles.relookCard}>
            <View style={[styles.relookHeaderIconBadgeSuccess, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="document-text" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.relookTitle}>Note pour le Recruteur 📝</Text>
            <Text style={styles.relookSubtitle}>
              Vous pouvez ajouter un message ou une note complémentaire pour le recruteur (optionnel).
            </Text>

            <TextInput
              style={{
                width: '100%',
                height: 100,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#0F172A',
                textAlignVertical: 'top',
                marginBottom: 16
              }}
              multiline
              numberOfLines={4}
              placeholder="Présentez-vous brièvement, vos disponibilités ou votre motivation..."
              placeholderTextColor="#94A3B8"
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity 
              style={[styles.relookPrimaryBtnSuccess, { backgroundColor: '#2563EB' }]}
              onPress={submitApplication}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.relookPrimaryBtnText}>Confirmer & Envoyer ma candidature</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.relookCancelBtn}
              onPress={() => setNoteModalVisible(false)}
              disabled={applying}
            >
              <Text style={styles.relookCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RELOOKED MISSION APPLICATION SUCCESS POPUP */}
      <Modal
        visible={showApplySuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowApplySuccessModal(false);
          handleClose();
        }}
      >
        <View style={styles.relookModalOverlay}>
          <View style={styles.relookCard}>
            <View style={styles.relookHeaderIconBadgeSuccess}>
              <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={styles.relookTitle}>Candidature Transmise ! 🎉</Text>
            <Text style={styles.relookSubtitle}>
              Votre profil et vos informations ont été transmis directement au recruteur pour cette mission.
            </Text>

            <View style={styles.relookSummaryBoxSuccess}>
              <Text style={styles.relookSuccessAmountLabel}>Mission</Text>
              <Text style={styles.relookSuccessAmountValue}>{mission?.titre || 'Mission Indebel'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.relookPrimaryBtnSuccess}
              onPress={() => {
                setShowApplySuccessModal(false);
                handleClose();
                router.replace('/freelancer/missions?tab=postulees');
              }}
            >
              <Ionicons name="briefcase-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.relookPrimaryBtnText}>Voir mes candidatures</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.relookCancelBtn}
              onPress={() => {
                setShowApplySuccessModal(false);
                handleClose();
              }}
            >
              <Text style={styles.relookCancelBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 25,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b4eef',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  bodyScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  badgeUrgent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeUrgentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  badgeCategory: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  badgeType: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  companyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 18,
  },
  companyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
  competencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  competenceBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  competenceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  footerAction: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#df6422',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#df6422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  appliedBannerText: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: '700',
  },
  creditInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  creditInfoText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  insufficientBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    gap: 6,
  },
  insufficientText: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
    fontWeight: '600',
  },
  rechargeBtnModal: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rechargeBtnModalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  employerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  employerAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  employerAvatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employerAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  employerRoleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  employerFullName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  employerContactPerson: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  employerContactDetailsRow: {
    marginTop: 4,
    gap: 2,
  },
  employerContactText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  employerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  employerVerifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  // KYC Overlay
  kycOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  kycCard: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 12 },
  kycHeaderIconBadge: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  kycTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  kycSubtitle: { fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 12 },
  kycText: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  kycActionsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  kycCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  kycCancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  kycConfirmBtn: { flex: 1.4, paddingVertical: 12, borderRadius: 14, backgroundColor: '#df6422', alignItems: 'center', justifyContent: 'center' },
  kycConfirmText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Zoom Overlay
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 10 },
  zoomCloseBtn: { position: 'absolute', top: 44, right: 20, zIndex: 10, padding: 8 },
  zoomImageFull: { width: '100%', height: '80%' },

  // RELOOK POPUP STYLING
  relookModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  relookCard: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
  relookHeaderIconBadgeSuccess: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  relookTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  relookSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  relookSummaryBoxSuccess: { width: '100%', backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 20, alignItems: 'center' },
  relookSuccessAmountLabel: { fontSize: 11, fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 },
  relookSuccessAmountValue: { fontSize: 18, fontWeight: '900', color: '#16A34A', marginTop: 4, textAlign: 'center' },
  relookPrimaryBtnSuccess: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 15, borderRadius: 18, marginBottom: 10, elevation: 4 },
  relookPrimaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  relookCancelBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  relookCancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
});
