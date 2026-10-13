import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { axiosClient } from '../api/axiosClient';

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  xpReward: number;
  current: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface DailyQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onXpClaimed?: (totalXp: number) => void;
}

export default function DailyQuestModal({
  visible,
  onClose,
  onXpClaimed,
}: DailyQuestModalProps) {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/student/quests/daily');
      if (res.data?.success) {
        setQuests(res.data.data.quests || []);
      }
    } catch (err) {
      console.log('Lỗi khi tải nhiệm vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchQuests();
    }
  }, [visible]);

  const handleClaim = async (quest: QuestItem) => {
    try {
      setClaimingId(quest.id);
      const res = await axiosClient.post('/student/quests/claim', {
        questId: quest.id,
      });

      if (res.data?.success) {
        Alert.alert(
          'Thành Công 🎉',
          `Bạn đã nhận được +${res.data.data.xpAwarded} XP thưởng! Tổng XP hiện tại: ${res.data.data.totalXp} XP`
        );
        if (onXpClaimed) {
          onXpClaimed(res.data.data.totalXp);
        }
        await fetchQuests();
      } else {
        Alert.alert('Thông báo', res.data?.message || 'Không thể nhận thưởng.');
      }
    } catch (err: any) {
      Alert.alert(
        'Thông báo',
        err.response?.data?.message || 'Có lỗi xảy ra khi nhận thưởng.'
      );
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalCount = quests.length || 3;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const getIconName = (icon: string): any => {
    switch (icon) {
      case 'sunny':
        return 'sunny';
      case 'book':
        return 'book';
      case 'game-controller':
        return 'game-controller';
      default:
        return 'ribbon';
    }
  };

  const getIconBg = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return '#fef3c7';
      case 'book':
        return '#dbeafe';
      case 'game-controller':
        return '#dcfce7';
      default:
        return '#ede9fe';
    }
  };

  const getIconColor = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return '#d97706';
      case 'book':
        return '#2563eb';
      case 'game-controller':
        return '#16a34a';
      default:
        return '#7c3aed';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={24} color="#15803d" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Nhiệm Vụ Hôm Nay</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Banner tiến độ */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.progressCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.progressCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.progressCardLabel}>TIẾN ĐỘ HÔM NAY</Text>
                <Text style={styles.progressCardTitle}>
                  {completedCount}/{totalCount} Nhiệm vụ hoàn thành
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                </View>
              </View>
              <Image
                source={require('../../assets/images/gacon.gif')}
                style={styles.mascotImg}
              />
            </View>
          </LinearGradient>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{ marginTop: 12, color: '#6b7280' }}>Đang tải nhiệm vụ...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {quests.map((q) => {
                const iconColor = getIconColor(q.icon);
                const iconBg = getIconBg(q.icon);

                return (
                  <View key={q.id} style={styles.questCard}>
                    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                      <Ionicons name={getIconName(q.icon)} size={24} color={iconColor} />
                    </View>

                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{q.title}</Text>
                      <Text style={styles.questDesc}>{q.description}</Text>

                      <View style={styles.targetRow}>
                        <View style={styles.targetBarBg}>
                          <View
                            style={[
                              styles.targetBarFill,
                              {
                                width: `${Math.min(100, Math.round((q.current / q.target) * 100))}%`,
                                backgroundColor: q.isCompleted ? '#10b981' : '#3b82f6',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.targetText}>
                          {q.current}/{q.target}
                        </Text>
                      </View>
                    </View>

                    {/* Action Button */}
                    <View style={styles.actionCol}>
                      {q.isClaimed ? (
                        <View style={styles.claimedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                          <Text style={styles.claimedText}>Đã nhận</Text>
                        </View>
                      ) : q.isCompleted ? (
                        <TouchableOpacity
                          style={styles.claimBtn}
                          onPress={() => handleClaim(q)}
                          disabled={claimingId === q.id}
                        >
                          {claimingId === q.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.claimBtnText}>+{q.xpReward} XP</Text>
                              <Text style={styles.claimBtnSub}>Nhận</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingXpText}>+{q.xpReward} XP</Text>
                          <Text style={styles.pendingText}>Chưa xong</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
  },
  progressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCardLabel: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  progressCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  mascotImg: {
    width: 60,
    height: 60,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  questDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  targetBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  actionCol: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimBtnSub: {
    color: '#ecfdf5',
    fontSize: 10,
    fontWeight: '600',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  claimedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  pendingBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 65,
  },
  pendingXpText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#9ca3af',
    fontSize: 10,
  },
});
