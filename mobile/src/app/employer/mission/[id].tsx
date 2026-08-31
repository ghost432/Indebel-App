import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../../api/client';
import Preloader from '../../../components/Preloader';

export default function EmployerMissionDetailModal() {
  const router = useRouter();
  const { id, type, source } = useLocalSearchParams();
  const [mission, setMission] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/employer/missions');
      }
    }, 50);
  };

  const fetchApplications = async (targetId: string) => {
    try {
      const res = await apiClient.get('/applications/employer').catch(() => apiClient.get('/applications/my-applications')).catch(() => ({ data: [] }));
      const raw = res.data?.data || res.data || [];
      if (Array.isArray(raw)) {
        const filtered = raw.filter((a: any) => String(a.mission_id || a.job_id || a.projet_id || a.id) === String(targetId) || String(targetId) === String(id));
        setApplications(filtered.length > 0 ? filtered : raw);
      }
    } catch (e) {
      console.warn('Erreur chargement candidatures:', e);
    }
  };

  const [confirmAppModal, setConfirmAppModal] = useState<{ appId: string; candidateName: string; decision: 'accepte' | 'refuse' } | null>(null);

  const handleApplicationDecision = (appId: string, candidateName: string, decision: 'accepte' | 'refuse') => {
    setConfirmAppModal({ appId, candidateName, decision });
  };

  const executeApplicationDecision = async () => {
    if (!confirmAppModal) return;
    const { appId, decision } = confirmAppModal;
    setActionLoadingId(appId);
    try {
      if (decision === 'accepte') {
        await apiClient.put(`/applications/${appId}/accept`).catch(() => apiClient.post(`/applications/${appId}/accept`));
      } else {
        await apiClient.put(`/applications/${appId}/reject`, { raison: 'Refusé par le recruteur' }).catch(() => apiClient.post(`/applications/${appId}/reject`));
      }
      setConfirmAppModal(null);
      Alert.alert('Succès 🎉', `Candidature ${decision === 'accepte' ? 'acceptée' : 'refusée'} avec succès !`);
      fetchApplications(String(id));
    } catch (err: any) {
      console.error('Erreur décision candidature:', err);
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'enregistrer votre choix.');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    setModalVisible(true);
    const fetchMissionDetail = async () => {
      try {
        setLoading(true);
        const missionTypeParam = (type as string) || 'hourly';
        let response = await apiClient.get(`/missions/public/${missionTypeParam}/${id}?source=${source || ''}`).catch(() => null);

        if (!response || !response.data || !response.data.data) {
          const alternateType = missionTypeParam === 'fixed' ? 'hourly' : 'fixed';
          response = await apiClient.get(`/missions/public/${alternateType}/${id}?source=${source || ''}`).catch(() => null);
        }

        if (response && response.data && response.data.data) {
          setMission(response.data.data);
        }
        await fetchApplications(String(id));
      } catch (error) {
        console.error('Erreur chargement détail mission employeur', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMissionDetail();
    } else {
      setLoading(false);
    }
  }, [id, type, source]);

  const dateStr = mission?.date_creation || mission?.created_at;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : 'Date inconnue';

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

  const isOpen = mission?.statut === 'en_attente' || mission?.statut === 'ouverte' || mission?.statut === 'ouvert' || mission?.status === 'Ouvert';
  const statusText = isOpen ? (mission?.statut === 'en_attente' ? 'En attente de validation' : 'Ouverte aux candidatures') : (mission?.statut === 'fermee' ? 'Fermée' : mission?.statut || 'Fermée');

  const budgetDisplay = mission?.forfait_heure 
    ? `${mission.forfait_heure} €/h` 
    : (mission?.forfait_mission ? `${mission.forfait_mission} €` : (mission?.budget_projet ? `${mission.budget_projet} €` : 'Non spécifié'));

  const isHourly = mission?.mission_type === 'hourly' || !!mission?.forfait_heure;

  const handleFinishMission = async () => {
    Alert.alert(
      'Marquer comme terminée 🏁',
      'Voulez-vous vraiment marquer cette mission comme terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, Terminer',
          onPress: async () => {
            try {
              const missionTypeParam = (type as string) || (isHourly ? 'hourly' : 'fixed');
              await apiClient.put(`/missions/${id}/status`, { statut: 'termine', type: missionTypeParam });
              Alert.alert('Succès 🎉', 'La mission a été marquée comme terminée.');
              setMission((prev: any) => prev ? { ...prev, statut: 'termine' } : prev);
            } catch (err: any) {
              console.error('Erreur marquer mission terminée:', err);
              Alert.alert('Erreur', err.response?.data?.message || 'Impossible de mettre à jour le statut.');
            }
          }
        }
      ]
    );
  };

  if (!modalVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheetContainer}>
          {/* Accent top gradient bar */}
          <LinearGradient
            colors={['#2b4eef', '#df6422']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientHeaderBar}
          />

          <TouchableOpacity style={styles.handleBarContainer} onPress={handleClose} activeOpacity={0.8}>
            <View style={styles.handleBar} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.headerIconBadge}>
              <Ionicons name="briefcase" size={22} color="#2b4eef" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerSubtitle}>Ma Mission Publiée</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {mission?.titre || mission?.title || 'Détails de la mission'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleClose}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <Preloader />
            </View>
          ) : !mission ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Mission introuvable</Text>
              <Text style={styles.emptyText}>Cette mission n'existe plus ou a été retirée.</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                {/* Hero Financial Banner */}
                <View style={styles.heroCard}>
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Rémunération / Budget</Text>
                      <Text style={styles.priceValue}>{budgetDisplay}</Text>
                    </View>

                    <View style={[styles.statusTag, isOpen ? styles.statusTagOpen : styles.statusTagClosed]}>
                      <View style={[styles.statusDot, isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
                      <Text style={[styles.statusTagText, isOpen ? styles.statusTagTextOpen : styles.statusTagTextClosed]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={styles.badgeCategory}>
                      <Ionicons name="pricetag-outline" size={13} color="#2b4eef" />
                      <Text style={styles.badgeCategoryText}>{mission.categorie || mission.secteur || 'Secteur non défini'}</Text>
                    </View>

                    <View style={styles.badgeType}>
                      <Ionicons name={isHourly ? "time-outline" : "cash-outline"} size={13} color="#0F172A" />
                      <Text style={styles.badgeTypeText}>{isHourly ? 'Forfait Horaire' : 'Forfait Fixe'}</Text>
                    </View>

                    {mission.urgente ? (
                      <View style={styles.badgeUrgent}>
                        <Ionicons name="flash" size={13} color="#EF4444" />
                        <Text style={styles.badgeUrgentText}>Urgente</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Details Micro-Cards */}
                <View style={styles.gridContainer}>
                  <View style={styles.gridCard}>
                    <View style={styles.gridIconCircle}>
                      <Ionicons name="location" size={18} color="#2b4eef" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gridLabel}>Localisation</Text>
                      <Text style={styles.gridValue}>
                        {mission.ville_mission || mission.adresse_mission || mission.autre_lieu || 'Belgique'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gridCard}>
                    <View style={[styles.gridIconCircle, { backgroundColor: '#FFF7ED' }]}>
                      <Ionicons name="calendar" size={18} color="#df6422" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gridLabel}>Date de publication</Text>
                      <Text style={styles.gridValue}>{formattedDate}</Text>
                    </View>
                  </View>

                  {mission.nombre_independants ? (
                    <View style={styles.gridCard}>
                      <View style={[styles.gridIconCircle, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="people" size={18} color="#16A34A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gridLabel}>Indépendants recherchés</Text>
                        <Text style={styles.gridValue}>{mission.nombre_independants} prestataires</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.titleAccentPill} />
                    <Text style={styles.sectionTitle}>Description de la mission</Text>
                  </View>
                  <Text style={styles.descriptionText}>{mission.description || 'Aucune description spécifique fournie.'}</Text>
                </View>

                {/* Competences */}
                {competences && competences.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.titleAccentPill, { backgroundColor: '#df6422' }]} />
                      <Text style={styles.sectionTitle}>Compétences requises</Text>
                    </View>
                    <View style={styles.competencesContainer}>
                      {Array.isArray(competences) ? competences.map((comp: string, index: number) => (
                        <View key={index} style={styles.competenceBadge}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#2563EB" />
                          <Text style={styles.competenceText}>{comp}</Text>
                        </View>
                      )) : <Text style={styles.descriptionText}>{competences}</Text>}
                    </View>
                  </View>
                )}

                {/* Candidatures Received & Action Buttons */}
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <View style={[styles.titleAccentPill, { backgroundColor: '#16A34A' }]} />
                    <Text style={styles.sectionTitle}>Candidatures reçues ({applications.length})</Text>
                  </View>

                  {applications.length === 0 ? (
                    <View style={styles.emptyAppBox}>
                      <Ionicons name="people-outline" size={32} color="#94A3B8" />
                      <Text style={styles.emptyAppText}>Aucune candidature pour le moment.</Text>
                    </View>
                  ) : (
                    applications.map((app: any, idx: number) => {
                      const isAcc = app.statut === 'accepte' || app.statut === 'valide';
                      const isRef = app.statut === 'refuse';
                      const isPend = !isAcc && !isRef;
                      const candidateName = app.freelancer_nom || `${app.freelancer_prenom || ''} ${app.freelancer_nom_famille || ''}`.trim() || 'Candidat Indépendant';
                      const appId = String(app.id || idx);

                      return (
                        <View key={appId} style={styles.appCard}>
                          <View style={styles.appCardHeader}>
                            <View style={styles.appAvatar}>
                              <Ionicons name="person" size={18} color="#2b4eef" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.appName}>{candidateName}</Text>
                              {app.freelancer_email ? <Text style={styles.appEmail}>{app.freelancer_email}</Text> : null}
                            </View>
                            <View style={[styles.appStatusTag, isAcc ? styles.appStatusAcc : isRef ? styles.appStatusRef : styles.appStatusPend]}>
                              <Text style={[styles.appStatusTagText, isAcc ? styles.appStatusTextAcc : isRef ? styles.appStatusTextRef : styles.appStatusTextPend]}>
                                {isAcc ? 'Accepté' : isRef ? 'Refusé' : 'En attente'}
                              </Text>
                            </View>
                          </View>

                          {app.message ? (
                            <View style={{ marginTop: 10, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 2 }}>Note / Présentation du candidat :</Text>
                              <Text style={{ fontSize: 13, color: '#0F172A', fontStyle: 'italic' }}>"{app.message}"</Text>
                            </View>
                          ) : null}

                          {isPend && (
                            <View style={styles.appActionsRow}>
                              <TouchableOpacity
                                style={styles.appRefuseBtn}
                                onPress={() => handleApplicationDecision(appId, candidateName, 'refuse')}
                                disabled={actionLoadingId === appId}
                              >
                                <Ionicons name="close-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={styles.appRefuseBtnText}>Refuser</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.appAcceptBtn}
                                onPress={() => handleApplicationDecision(appId, candidateName, 'accepte')}
                                disabled={actionLoadingId === appId}
                              >
                                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={styles.appAcceptBtnText}>Accepter la candidature</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                <View style={{ height: 110 }} />
              </ScrollView>

              {/* Sticky Action Footer */}
              <View style={styles.footerAction}>
                {mission?.statut !== 'termine' && (
                  <TouchableOpacity
                    style={[styles.closeActionBtn, { backgroundColor: '#10B981', marginBottom: 10 }]}
                    onPress={handleFinishMission}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.closeActionBtnText}>Marquer la mission comme terminée</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeActionBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.closeActionBtnText}>Retour à mes missions</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* RELOOKED CANDIDATURE DECISION CONFIRMATION POPUP (ACCEPT OR REFUSE MISSION APPLICATION) */}
      <Modal
        visible={confirmAppModal !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmAppModal(null)}
      >
        <View style={styles.relookModalOverlay}>
          <View style={styles.relookCard}>
            {confirmAppModal?.decision === 'accepte' ? (
              <>
                <View style={styles.relookHeaderIconBadgeSuccess}>
                  <Ionicons name="checkmark-circle" size={42} color="#FFFFFF" />
                </View>
                <Text style={styles.relookTitle}>Accepter la Candidature 🎉</Text>
                <Text style={styles.relookSubtitle}>
                  Êtes-vous sûr de vouloir sélectionner ce candidat pour votre mission ?
                </Text>
              </>
            ) : (
              <>
                <View style={styles.relookHeaderIconBadgeDanger}>
                  <Ionicons name="close-circle" size={42} color="#FFFFFF" />
                </View>
                <Text style={styles.relookTitle}>Refuser la Candidature ⚠️</Text>
                <Text style={styles.relookSubtitle}>
                  Êtes-vous sûr de vouloir decliner cette candidature ?
                </Text>
              </>
            )}

            <View style={confirmAppModal?.decision === 'accepte' ? styles.relookSummaryBoxSuccess : styles.relookSummaryBoxDanger}>
              <View style={styles.relookSummaryRow}>
                <Text style={styles.relookSummaryLabel}>Candidat :</Text>
                <Text style={styles.relookSummaryValue}>{confirmAppModal?.candidateName || 'Candidat'}</Text>
              </View>
              <View style={styles.relookSummaryRow}>
                <Text style={styles.relookSummaryTotalLabel}>Mission :</Text>
                <Text style={styles.relookSummaryTotalValue}>{mission?.titre || 'Mission'}</Text>
              </View>
            </View>

            {confirmAppModal?.decision === 'accepte' ? (
              <TouchableOpacity 
                style={styles.relookPrimaryBtnSuccess}
                onPress={executeApplicationDecision}
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId !== null ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.relookPrimaryBtnText}>Oui, Accepter la Candidature</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.relookPrimaryBtnDanger}
                onPress={executeApplicationDecision}
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId !== null ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.relookPrimaryBtnText}>Oui, Refuser la Candidature</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.relookCancelBtn}
              onPress={() => setConfirmAppModal(null)}
              disabled={actionLoadingId !== null}
            >
              <Text style={styles.relookCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.70)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  sheetContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', minHeight: '60%', elevation: 25, overflow: 'hidden' },
  gradientHeaderBar: { height: 4, width: '100%' },
  handleBarContainer: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerIconBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#2b4eef', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { padding: 60, alignItems: 'center' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  bodyScroll: { paddingHorizontal: 24, paddingTop: 16 },
  heroCard: { backgroundColor: '#F8FAFC', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 18, gap: 14 },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceContainer: {},
  priceLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  priceValue: { fontSize: 26, fontWeight: '900', color: '#df6422', marginTop: 2 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusTagOpen: { backgroundColor: '#DCFCE7' },
  statusTagClosed: { backgroundColor: '#FEF3C7' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotOpen: { backgroundColor: '#16A34A' },
  statusDotClosed: { backgroundColor: '#D97706' },
  statusTagText: { fontSize: 12, fontWeight: '800' },
  statusTagTextOpen: { color: '#15803D' },
  statusTagTextClosed: { color: '#B45309' },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badgeCategory: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  badgeCategoryText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  badgeType: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  badgeTypeText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  badgeUrgent: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  badgeUrgentText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  gridContainer: { gap: 10, marginBottom: 20 },
  gridCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  gridIconCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  gridValue: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  section: { marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  titleAccentPill: { width: 4, height: 16, borderRadius: 2, backgroundColor: '#2b4eef' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#334155', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9' },
  competencesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  competenceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, gap: 6 },
  competenceText: { color: '#1D4ED8', fontSize: 13, fontWeight: '700' },
  footerAction: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  closeActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2b4eef', paddingVertical: 16, borderRadius: 18, shadowColor: '#2b4eef', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  closeActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  emptyAppBox: { padding: 20, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  emptyAppText: { fontSize: 13, color: '#64748B', marginTop: 6, fontWeight: '600' },
  appCard: { backgroundColor: '#F8FAFC', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  appCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  appName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  appEmail: { fontSize: 12, color: '#64748B' },
  appStatusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  appStatusAcc: { backgroundColor: '#DCFCE7' },
  appStatusRef: { backgroundColor: '#FEE2E2' },
  appStatusPend: { backgroundColor: '#FEF3C7' },
  appStatusTagText: { fontSize: 11, fontWeight: '800' },
  appStatusTextAcc: { color: '#15803D' },
  appStatusTextRef: { color: '#B91C1C' },
  appStatusTextPend: { color: '#B45309' },
  appActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  appRefuseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 10, borderRadius: 12 },
  appRefuseBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  appAcceptBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 10, borderRadius: 12 },
  appAcceptBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // RELOOK DECISION POPUPS STYLING
  relookModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  relookCard: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
  relookHeaderIconBadgeSuccess: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  relookHeaderIconBadgeDanger: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  relookTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  relookSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  relookSummaryBoxSuccess: { width: '100%', backgroundColor: '#F0FDF4', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 20, gap: 8 },
  relookSummaryBoxDanger: { width: '100%', backgroundColor: '#FEF2F2', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 20, gap: 8 },
  relookSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relookSummaryLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  relookSummaryValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  relookSummaryTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  relookSummaryTotalValue: { fontSize: 14, fontWeight: '800', color: '#2b4eef' },
  relookPrimaryBtnSuccess: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 15, borderRadius: 18, marginBottom: 10, elevation: 4 },
  relookPrimaryBtnDanger: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', paddingVertical: 15, borderRadius: 18, marginBottom: 10, elevation: 4 },
  relookPrimaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  relookCancelBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  relookCancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
});
