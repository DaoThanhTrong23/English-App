import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';
import NotificationModal, { NotificationItem } from '../../components/NotificationModal';
import DailyQuestModal from '../../components/DailyQuestModal';
import { notificationService } from '../../service/notificationService';
import { useAppTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetLevel, setTargetLevel] = useState<string>('Đang cập nhật...');
  const [courses, setCourses] = useState<any[]>([]);

  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [questModalVisible, setQuestModalVisible] = useState(false);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await axiosClient.get('/student/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.log('Lỗi khi tải thông báo:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await axiosClient.put(`/student/notifications/${id}/read`);
    } catch (err) {
      console.log('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await Promise.all(
      unread.map((n) =>
        axiosClient.put(`/student/notifications/${n.id}/read`).catch(() => {})
      )
    );
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAvatar = async () => {
        try {
          const storedAvatar = await SecureStore.getItemAsync('userAvatar');
          if (storedAvatar) {
            setAvatarUri(storedAvatar);
          } else {
            // Nếu cache chưa có avatar, đồng bộ từ server
            const res = await axiosClient.get('/profile/me');
            if (res.data?.success && res.data.data?.avatarUrl) {
              const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
              const fullAvatar = res.data.data.avatarUrl.startsWith('http') ? res.data.data.avatarUrl : baseURL + res.data.data.avatarUrl;
              setAvatarUri(fullAvatar);
              await SecureStore.setItemAsync('userAvatar', fullAvatar);
            }
          }
        } catch (error) {
          console.log("Error fetching avatar data:", error);
        }
      };
      fetchAvatar();
      loadHomeData();
      loadNotifications();
      // Tự động đồng bộ khung giờ học quen thuộc từ Server/AI và lên lịch nhắc nhở hàng ngày
      notificationService.syncAndScheduleHabitReminder();
    }, [])
  );

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const info = await SecureStore.getItemAsync('userInfo');
      if (info) setUserInfo(JSON.parse(info));

      const avatar = await SecureStore.getItemAsync('userAvatar');
      if (avatar) setAvatarUri(avatar);

      const levelGroup = await SecureStore.getItemAsync('targetLevelGroup');
      if (levelGroup) setTargetLevel(levelGroup);

      const res = await axiosClient.get('/student/courses', {
        params: { targetLevelGroup: levelGroup }
      });

      if (res.data?.success) {
        const fetchedCourses = res.data.data.items || [];
        setCourses(fetchedCourses);

        if (res.data.data.streak !== undefined) {
          setStreak(res.data.data.streak);
        }

        if (fetchedCourses.length > 0) {
          const firstCourse = fetchedCourses[0];
          
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const username = userInfo?.username || "Học viên";
  const overallProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / courses.length) 
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/gacon.gif')} style={[styles.avatar, { borderColor: theme.border }]} />
            <View>
              <Text style={[styles.greeting, { color: theme.text }]}>Xin chào, {username}!</Text>
              <View style={[styles.streakBadge, { backgroundColor: isDark ? '#451a03' : '#fff7ed' }]}>
                <Text style={[styles.streakText, { color: isDark ? '#fb923c' : '#ea580c' }]}>
                  🔥 {streak > 0 ? `${streak} ngày liên tiếp` : '0 ngày liên tiếp'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setNotifModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <View style={[styles.notifBadge, { borderColor: theme.card }]}>
                <Text style={styles.notifBadgeText}>
                  {notifications.filter((n) => !n.isRead).length > 9
                    ? '9+'
                    : notifications.filter((n) => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* CẤP ĐỘ HIỆN TẠI (LEVEL CARD) */}
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>CẤP ĐỘ HIỆN TẠI</Text>
          <Text style={styles.levelTitle}>{targetLevel}</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Tiến trình chung</Text>
            <Text style={styles.progressPercent}>{overallProgress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${overallProgress}%`, backgroundColor: '#ffffff' }]} />
          </View>
        </View>

        
        {/* GAME HUB & NHIỆM VỤ */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <TouchableOpacity 
            style={{
              flex: 1, 
              backgroundColor: isDark ? '#1c1917' : '#fef3c7', 
              padding: 15, 
              borderRadius: 16, 
              marginRight: 10, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: isDark ? '#44403c' : '#fde68a'
            }}
            onPress={() => { /* @ts-ignore */ router.push('/games')}}
          >
            <Ionicons name="game-controller" size={32} color={isDark ? '#facc15' : '#d97706'} />
            <Text style={{fontWeight: 'bold', color: isDark ? '#fbbf24' : '#b45309', marginTop: 8}}>Giải Trí</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{
              flex: 1, 
              backgroundColor: isDark ? '#052e16' : '#dcfce7', 
              padding: 15, 
              borderRadius: 16, 
              marginLeft: 10, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: isDark ? '#14532d' : '#bbf7d0'
            }}
            onPress={() => setQuestModalVisible(true)}
          >
            <Ionicons name="calendar" size={32} color={isDark ? '#4ade80' : '#15803d'} />
            <Text style={{fontWeight: 'bold', color: isDark ? '#4ade80' : '#166534', marginTop: 8}}>Nhiệm Vụ</Text>
          </TouchableOpacity>
        </View>

        {/* CHỦ ĐỀ HỌC TẬP */}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Chủ đề học tập</Text>
        <View style={styles.topicsContainer}>
          {courses.map((course: any) => {
             
             const pct = course.progressPercentage || 0;
             return (
              <TouchableOpacity 
                key={course.id} 
                style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={() => {
                  router.push({ pathname: '/(tabs)/course/[id]', params: { id: course.id } } as any);
                }}>
                <View style={styles.topicHeader}>
                  <View style={[styles.topicIconContainer, { backgroundColor: theme.cardSecondary, padding: 0, overflow: 'hidden' }]}>
                    <Image source={course.imageUrl ? { uri: course.imageUrl } : require('../../../assets/images/gacon.gif')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                  <View style={styles.topicInfo}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.topicTitle, { color: theme.text }]}>{course.title}</Text>
                      <Text style={[styles.topicPercent, {color: pct > 0 ? '#10b981' : theme.subtext}]}>{pct}%</Text>
                    </View>
                    <Text style={[styles.topicSubtitle, { color: theme.subtext }]}>
                      {course.completedLessons > 0 ? `${course.completedLessons}/${course.totalLessons} bài học đã học` : `${course.totalLessons} bài học`}
                    </Text>
                    <View style={[styles.topicProgressBarBg, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                      <View style={[styles.topicProgressBarFill, { width: `${pct}%`, backgroundColor: pct > 0 ? '#10b981' : (isDark ? '#3f3f46' : '#e5e7eb') }]} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
             );
          })}
        </View>

        {/* BOTTOM BANNER - NHIỆM VỤ HÔM NAY */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setQuestModalVisible(true)}>
          <View style={styles.challengeBanner}>
            <View style={styles.challengeIconContainer}>
              <Ionicons name="ribbon-outline" size={28} color="#ffffff" />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeLabel}>THỬ THÁCH HÔM NAY 🎯</Text>
              <Text style={styles.challengeTitle}>Chinh phục các nhiệm vụ hàng ngày để tích lũy XP!</Text>
              <Text style={{color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2}}>Chạm để xem tiến độ & nhận thưởng ✨</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff" style={{marginLeft: 8}} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL NHIỆM VỤ HẰNG NGÀY */}
      <DailyQuestModal
        visible={questModalVisible}
        onClose={() => setQuestModalVisible(false)}
        onXpClaimed={(totalXp) => {
          if (userInfo) {
            setUserInfo({ ...userInfo, xpPoints: totalXp });
          }
        }}
      />

      {/* MODAL THÔNG BÁO */}
      <NotificationModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
        notifications={notifications}
        loading={notifLoading}
        onRefresh={loadNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#e5e7eb', marginRight: 12 },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  streakBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  streakText: { fontSize: 11, fontWeight: 'bold' },
  notificationBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' },
  notifBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#ffffff' },
  notifBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  levelCard: { backgroundColor: '#4f46e5', padding: 20, borderRadius: 16, marginBottom: 25, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  levelLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  levelTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 25 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressPercent: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 15, marginTop: 5 },

  topicsContainer: { marginBottom: 10 },
  topicCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12, backgroundColor: '#ffffff' },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIconContainer: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  topicPercent: { fontSize: 14, fontWeight: 'bold' },
  topicSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  topicProgressBarBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, overflow: 'hidden' },
  topicProgressBarFill: { height: '100%', borderRadius: 2 },

  lessonsContainer: { marginBottom: 10 },
  lessonCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12, backgroundColor: '#ffffff' },
  lessonHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  lessonTitleText: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  lessonSubtitleText: { fontSize: 12, color: '#6b7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  lessonSkillsRow: { flexDirection: 'row', gap: 10 },
  skillIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  challengeBanner: { backgroundColor: '#ef4444', flexDirection: 'row', padding: 20, borderRadius: 16, marginTop: 10, alignItems: 'center' },
  challengeIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  challengeInfo: { flex: 1 },
  challengeLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  challengeTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', lineHeight: 22 }
});