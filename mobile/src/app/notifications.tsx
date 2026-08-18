import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import PremiumBackground from '../components/PremiumBackground';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  date_creation: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications');
      const data = response.data?.data || [];
      // Sorter par date de création décroissante (plus récent en premier)
      const sortedData = data.sort((a: Notification, b: Notification) => 
        new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
      );
      setNotifications(sortedData);
    } catch (error: any) {
      console.error('❌ Erreur chargement notifications mobile:', error.message);
      Alert.alert('Erreur', 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
    } catch (error) {
      console.error('❌ Erreur mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.lu).length;
    if (unreadCount === 0) return;

    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues.');
    } catch (error) {
      console.error('❌ Erreur mark all as read:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les notifications.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      Alert.alert('Erreur', 'Impossible de supprimer cette notification.');
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Tout supprimer',
      'Êtes-vous sûr de vouloir supprimer toutes vos notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Suppression séquentielle/parallèle
              await Promise.all(notifications.map(n => apiClient.delete(`/notifications/${n.id}`)));
              setNotifications([]);
              Alert.alert('Succès', 'Toutes les notifications ont été supprimées.');
            } catch (error) {
              console.error('❌ Erreur suppression de toutes les notifications:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'error':
        return { name: 'close-circle' as const, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'warning':
        return { name: 'alert-circle' as const, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'demande':
        return { name: 'people' as const, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'mission':
        return { name: 'briefcase' as const, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'verification':
        return { name: 'shield-checkmark' as const, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' };
      case 'info':
      default:
        return { name: 'information-circle' as const, color: '#082151', bg: 'rgba(8, 33, 81, 0.15)' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.lu;
    if (filter === 'read') return n.lu;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <PremiumBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#082151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerRight}>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleDeleteAll} style={styles.clearAllBtn}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action / Mark all read */}
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBanner} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.markReadBannerText}>Tout marquer comme lu ({unreadCount})</Text>
          </TouchableOpacity>
        )}

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, filter === 'all' && styles.activeTab]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>
              Toutes ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, filter === 'unread' && styles.activeTab]} 
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.tabText, filter === 'unread' && styles.activeTabText]}>
              Non lues ({unreadCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, filter === 'read' && styles.activeTab]} 
            onPress={() => setFilter('read')}
          >
            <Text style={[styles.tabText, filter === 'read' && styles.activeTabText]}>
              Lues ({notifications.length - unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#082151" />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread' 
                ? "Vous n'avez pas de notifications non lues." 
                : filter === 'read' 
                ? "Vous n'avez pas de notifications lues." 
                : "Vous n'avez pas encore reçu de notifications."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#082151" />
            }
            renderItem={({ item }) => {
              const iconMeta = getNotificationIcon(item.type);
              return (
                <TouchableOpacity 
                  style={[styles.card, !item.lu && styles.unreadCard]}
                  onPress={() => !item.lu && handleMarkAsRead(item.id)}
                  activeOpacity={item.lu ? 1 : 0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrapper, { backgroundColor: iconMeta.bg }]}>
                      <Ionicons name={iconMeta.name} size={22} color={iconMeta.color} />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.title, !item.lu && styles.unreadText]} numberOfLines={1}>
                          {item.titre}
                        </Text>
                        {!item.lu && <View style={styles.badgeDot} />}
                      </View>
                      <Text style={styles.message}>{item.message}</Text>
                      <Text style={styles.time}>{getTimeAgo(item.date_creation)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#082151',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  clearAllBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
  },
  markReadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B4EEF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#2B4EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  markReadBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(226, 232, 240, 0.4)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#082151',
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#082151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(43, 78, 239, 0.25)',
    borderWidth: 1,
    shadowColor: '#2B4EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  unreadText: {
    color: '#082151',
    fontWeight: '800',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B4EEF',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
});
