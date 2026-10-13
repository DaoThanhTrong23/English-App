import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';
import { notificationService } from '../service/notificationService';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading: boolean;
  onRefresh: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationModal({
  visible,
  onClose,
  notifications,
  loading,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationModalProps) {
  const [testing, setTesting] = useState(false);
  const [habitTime, setHabitTime] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      axiosClient
        .get('/student/notifications/preferred-time')
        .then((res) => {
          if (res.data?.success && res.data.data?.formattedTime) {
            setHabitTime(res.data.data.formattedTime);
          }
        })
        .catch(() => {});
    }
  }, [visible]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('chuỗi') || title.includes('mất chuỗi')) {
      return { name: 'flame' as const, color: '#ea580c', bg: '#ffedd5' };
    }
    if (title.includes('giờ học') || title.includes('nhắc nhở')) {
      return { name: 'alarm' as const, color: '#2563eb', bg: '#dbeafe' };
    }
    return { name: 'notifications' as const, color: '#7c3aed', bg: '#ede9fe' };
  };

  const handleTestLocalNotification = async () => {
    setTesting(true);
    await notificationService.triggerImmediateNotification(
      'Đã đến giờ học tiếng Anh! ⏰',
      'Đừng quên hoàn thành bài học hôm nay để duy trì chuỗi streak nhé! 🔥'
    );
    setTesting(false);
    Alert.alert('Thành công', 'Đã bắn thông báo nhắc nhở ra thanh thông báo / màn hình khóa!');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Thông báo</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount} mới</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={onMarkAllAsRead} style={styles.markAllBtn}>
                  <Text style={styles.markAllText}>Đọc tất cả</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Smart Habit Reminder Banner */}
          {habitTime && (
            <View style={styles.habitBanner}>
              <View style={styles.habitIconBg}>
                <Ionicons name="sparkles" size={16} color="#4f46e5" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.habitTitle}>Khung giờ học thói quen: {habitTime}</Text>
                <Text style={styles.habitSubtitle}>Đã tự động đặt lịch nhắc nhở mỗi ngày</Text>
              </View>
            </View>
          )}

          {/* Test Notification Button */}
          <View style={styles.testBar}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestLocalNotification}
              disabled={testing}
            >
              <Ionicons name="phone-portrait-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={styles.testBtnText}>
                {testing ? 'Đang gửi...' : 'Test thông báo màn hình khóa'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="notifications-off-outline" size={40} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>
                Hệ thống sẽ gửi nhắc nhở khi đến khung giờ học quen thuộc của bạn!
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const iconInfo = getNotificationIcon(item.title);
                return (
                  <TouchableOpacity
                    style={[
                      styles.itemCard,
                      !item.isRead && styles.unreadCard,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!item.isRead) onMarkAsRead(item.id);
                    }}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
                      </View>
                      <Text style={styles.itemBody}>{item.body}</Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllBtn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  habitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  habitIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730a3',
  },
  habitSubtitle: {
    fontSize: 11,
    color: '#4f46e5',
    marginTop: 2,
  },
  testBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  testBtnText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  unreadCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  itemTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  itemBody: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginTop: 6,
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
