import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';
import NotificationModal, { NotificationItem } from '../../components/NotificationModal';
import DailyQuestModal from '../../components/DailyQuestModal';
import CertificateModal, { CertificateData } from '../../components/CertificateModal';
import VocabReviewModal from '../../components/VocabReviewModal';
import { notificationService } from '../../service/notificationService';
import { useAppTheme } from '../../context/ThemeContext';
import { getFullMediaUrl } from '../../utils/media';

const APP_LEVEL_GROUPS = [
  { id: 'A1-A2', name: 'Dễ', title: 'Dễ (A1 - A2)', desc: 'Dành cho người mới bắt đầu', levels: ['A1', 'A2'] },
  { id: 'B1-B2', name: 'Trung bình', title: 'Trung bình (B1 - B2)', desc: 'Giao tiếp cơ bản đến khá', levels: ['B1', 'B2'] },
  { id: 'C1-C2', name: 'Khó', title: 'Khó (C1 - C2)', desc: 'Thành thạo và chuyên sâu', levels: ['C1', 'C2'] },
];

const mapCefrToGroup = (cefr?: string | null): string => {
  if (!cefr) return 'A1-A2';
  if (cefr === 'A1' || cefr === 'A2' || cefr === 'A1-A2') return 'A1-A2';
  if (cefr === 'B1' || cefr === 'B2' || cefr === 'B1-B2') return 'B1-B2';
  if (cefr === 'C1' || cefr === 'C2' || cefr === 'C1-C2') return 'C1-C2';
  return 'A1-A2';
};

export default function HomeScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const cardScrollRef = useRef<ScrollView>(null);
  const isUserSwipingRef = useRef(false);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.max(screenWidth - 40, 280);

  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetLevelGroup, setTargetLevelGroup] = useState<string>('A1-A2');
  const [selectedLevelGroup, setSelectedLevelGroup] = useState<string>('A1-A2');
  const [courses, setCourses] = useState<any[]>([]);
  const [groupsProgress, setGroupsProgress] = useState<any[]>([]);
  const [unlockedGroups, setUnlockedGroups] = useState<string[]>(['A1-A2']);

  // Certificate states
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<CertificateData | null>(null);

  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [questModalVisible, setQuestModalVisible] = useState(false);

  // Vocab / Spaced Repetition states
  const [vocabStats, setVocabStats] = useState({
    totalSaved: 0,
    dueCount: 0,
    masteredCount: 0,
  });
  const [dueReviews, setDueReviews] = useState<any[]>([]);
  const [savedWords, setSavedWords] = useState<any[]>([]);
  const [vocabReviewVisible, setVocabReviewVisible] = useState(false);
  const [vocabReviewQueue, setVocabReviewQueue] = useState<any[]>([]);

  const fetchVocabData = async () => {
    try {
      const [savedRes, dueRes] = await Promise.all([
        axiosClient.get('/profile/saved-words').catch(() => ({ data: { success: false, data: [] } })),
        axiosClient.get('/student/vocabulary/reviews/due').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const allSaved = savedRes.data?.data || [];
      const dues = dueRes.data?.data || [];
      setSavedWords(allSaved);
      setDueReviews(dues);

      const mastered = allSaved.filter((w: any) => w.status === 'mastered' || (w.memoryLevel || 0) >= 4).length;

      setVocabStats({
        totalSaved: allSaved.length,
        dueCount: dues.length,
        masteredCount: mastered,
      });
    } catch (err) {
      console.log('Lỗi khi tải dữ liệu từ vựng:', err);
    }
  };

  const startHomeReviewSession = (mode: 'due' | 'all') => {
    let queue: any[] = [];
    if (mode === 'due') {
      queue = [...dueReviews];
      if (queue.length === 0) {
        Alert.alert(
          'Không có từ cần ôn tập!',
          'Hôm nay bạn không có từ nào đến hạn ôn tập SRS. Bạn có muốn luyện tập tự do tất cả từ đã lưu không?',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Luyện tập tự do', onPress: () => startHomeReviewSession('all') },
          ]
        );
        return;
      }
    } else {
      queue = [...savedWords];
      if (queue.length === 0) {
        Alert.alert('Chưa có từ vựng', 'Bạn chưa lưu từ vựng nào để ôn tập!');
        return;
      }
    }

    setVocabReviewQueue(queue);
    setVocabReviewVisible(true);
  };

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
            const res = await axiosClient.get('/profile/me');
            if (res.data?.success && res.data.data?.avatarUrl) {
              const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
              const fullAvatar = res.data.data.avatarUrl.startsWith('http')
                ? res.data.data.avatarUrl
                : baseURL + res.data.data.avatarUrl;
              setAvatarUri(fullAvatar);
              await SecureStore.setItemAsync('userAvatar', fullAvatar);
            }
          }
        } catch (error) {
          console.log('Error fetching avatar data:', error);
        }
      };
      fetchAvatar();
      loadHomeData();
      loadNotifications();
      fetchVocabData();
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

      let currentGroup = 'A1-A2';
      const levelGroup = await SecureStore.getItemAsync('targetLevelGroup');
      if (levelGroup) {
        currentGroup = mapCefrToGroup(levelGroup);
        setTargetLevelGroup(currentGroup);
        setSelectedLevelGroup(currentGroup);
      }

      // 1. Đồng bộ thông tin người dùng mới nhất từ server
      let currentUserId = 'default';
      try {
        const meRes = await axiosClient.get('/profile/me');
        if (meRes.data?.success && meRes.data.data) {
          const freshUser = meRes.data.data;
          currentUserId = freshUser.id?.toString() || 'default';
          setUserInfo(freshUser);
          await SecureStore.setItemAsync('userInfo', JSON.stringify(freshUser));
          if (!levelGroup && freshUser.cefrLevel) {
            currentGroup = mapCefrToGroup(freshUser.cefrLevel);
            setTargetLevelGroup(currentGroup);
            setSelectedLevelGroup(currentGroup);
          }
        }
      } catch (e) {
        if (info) currentUserId = JSON.parse(info).id?.toString() || 'default';
      }

      // Khôi phục danh sách lộ trình đã mở khóa từ SecureStore
      let currentUnlocked: string[] = [currentGroup];
      try {
        const savedUnlockedStr = await SecureStore.getItemAsync(`unlocked_routes_${currentUserId}`);
        if (savedUnlockedStr) {
          currentUnlocked = JSON.parse(savedUnlockedStr);
        }
      } catch (e) {}

      if (!currentUnlocked.includes(currentGroup)) {
        currentUnlocked.push(currentGroup);
      }

      // 2. Tải tiến độ tổng hợp các cấp độ (3 Options: Dễ, Trung bình, Khó)
      let grps: any[] = [];
      try {
        const levelsRes = await axiosClient.get('/student/courses/levels-progress');
        if (levelsRes.data?.success && levelsRes.data.data?.groups) {
          grps = levelsRes.data.data.groups;
          setGroupsProgress(grps);
        }
      } catch (err) {
        console.log('Error loading levels progress:', err);
      }

      setUnlockedGroups(currentUnlocked);
      await SecureStore.setItemAsync(`unlocked_routes_${currentUserId}`, JSON.stringify(currentUnlocked));

      // 3. Tải danh sách khóa học theo cấp độ đang chọn
      const coursesRes = await axiosClient.get('/student/courses', {
        params: { targetLevelGroup: currentGroup },
      });

      if (coursesRes.data?.success) {
        const fetchedCourses = coursesRes.data.data.items || [];
        setCourses(fetchedCourses);

        if (coursesRes.data.data.streak !== undefined) {
          setStreak(coursesRes.data.data.streak);
        }

        // Tự động kiểm tra nếu cấp độ này đã hoàn thành 100% lần đầu thì mở Certificate Modal
        const currentGrpData = grps.find((g) => g.id === currentGroup);
        if (currentGrpData && currentGrpData.isCompleted) {
          const certKey = `cert_seen_${currentGroup}_${info ? JSON.parse(info).id : '0'}`;
          const hasSeen = await SecureStore.getItemAsync(certKey);
          if (!hasSeen) {
            await SecureStore.setItemAsync(certKey, 'true');
            openCertificate(currentGroup, grps, freshCoursesSummary(fetchedCourses, currentGrpData));
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const freshCoursesSummary = (courseList: any[], grpData: any) => {
    const totalLessons = grpData?.totalLessons || courseList.reduce((acc, c) => acc + (c.totalLessons || 0), 0);
    const totalWords = grpData?.totalWords || 50;
    return { totalLessons, totalWords };
  };

  // Switch between Level Groups (Dễ, Trung bình, Khó)
  const handleSelectLevelGroup = async (groupId: string) => {
    try {
      setSelectedLevelGroup(groupId);
      const res = await axiosClient.get('/student/courses', {
        params: { targetLevelGroup: groupId },
      });

      if (res.data?.success) {
        setCourses(res.data.data.items || []);
      }
    } catch (err) {
      console.log('Error switching level group courses:', err);
    }
  };

  // Set the selected level group as primary in User Account & Thêm tab mới cho lộ trình mới
  const handleSetActivePrimaryLevelGroup = async (groupId: string) => {
    try {
      const res = await axiosClient.post('/student/courses/set-active-level', { level: groupId });
      if (res.data?.success) {
        setTargetLevelGroup(groupId);
        await SecureStore.setItemAsync('targetLevelGroup', groupId);

        // Mở khóa thêm tab mới cho lộ trình mới được chọn
        const currentUserId = userInfo?.id?.toString() || 'default';
        const updatedUnlocked = Array.from(new Set([...unlockedGroups, groupId]));
        setUnlockedGroups(updatedUnlocked);
        await SecureStore.setItemAsync(`unlocked_routes_${currentUserId}`, JSON.stringify(updatedUnlocked));

        Alert.alert('Thành công', `Đã chọn mục tiêu ${getGroupTitle(groupId)} làm lộ trình học chính của bạn!`);
      }
    } catch (err: any) {
      Alert.alert('Thông báo', err.response?.data?.message || 'Không thể đổi mục tiêu chính lúc này');
    }
  };

  const getGroupTitle = (groupId: string) => {
    const meta = APP_LEVEL_GROUPS.find((g) => g.id === groupId);
    return meta ? meta.title : groupId;
  };

  // Open Certificate Modal
  const openCertificate = (groupId?: string, groupsDataArr?: any[], stats?: any) => {
    const targetG = groupId || selectedLevelGroup;
    const dataList = groupsDataArr || groupsProgress;
    const grpInfo = dataList.find((g: any) => g.id === targetG);
    const grpMeta = APP_LEVEL_GROUPS.find((g) => g.id === targetG) || APP_LEVEL_GROUPS[0];

    const nextGroupMap: Record<string, string> = {
      'A1-A2': 'B1-B2',
      'B1-B2': 'C1-C2',
      'C1-C2': 'A1-A2',
    };

    const cert: CertificateData = {
      certificateId: grpInfo?.certificate?.certificateId || `ENG-${targetG}-${userInfo?.id || '001'}`,
      recipientName: userInfo?.username || 'Học viên EngMaster',
      level: targetG,
      levelTitle: grpMeta.title,
      totalLessons: stats?.totalLessons || grpInfo?.totalLessons || courses.reduce((a, c) => a + (c.totalLessons || 0), 0),
      totalWords: stats?.totalWords || grpInfo?.totalWords || 60,
      xpPoints: userInfo?.xpPoints || 120,
      issuedDate: new Date().toLocaleDateString('vi-VN'),
      nextLevel: nextGroupMap[targetG] || null,
    };

    setCurrentCertificate(cert);
    setCertModalVisible(true);
  };

  const handleScrollToTopics = () => {
    if (courses.length > 0) {
      router.push({ pathname: '/(tabs)/course/[id]', params: { id: courses[0].id } } as any);
    }
  };

  const handleRelearnLevel = async (groupId: string) => {
    try {
      if (groupId !== selectedLevelGroup) {
        setSelectedLevelGroup(groupId);
        const res = await axiosClient.get('/student/courses', {
          params: { targetLevelGroup: groupId },
        });
        if (res.data?.success && res.data.data?.items?.length > 0) {
          setCourses(res.data.data.items);
          router.push({ pathname: '/(tabs)/course/[id]', params: { id: res.data.data.items[0].id } } as any);
          return;
        }
      }
      handleScrollToTopics();
    } catch (e) {
      handleScrollToTopics();
    }
  };

  // Chỉ hiển thị các lộ trình ban đầu đã chọn hoặc các lộ trình mới được mở khóa sau khi học xong
  const visibleGroups = APP_LEVEL_GROUPS.filter((item) => {
    return (
      unlockedGroups.includes(item.id) ||
      item.id === selectedLevelGroup ||
      item.id === targetLevelGroup
    );
  });

  // Tự động cuộn đến thẻ đang được chọn khi mở khóa lộ trình mới hoặc thay đổi cấp độ
  useEffect(() => {
    if (!isUserSwipingRef.current && cardScrollRef.current && visibleGroups.length > 1) {
      const activeIdx = visibleGroups.findIndex((g) => g.id === selectedLevelGroup);
      if (activeIdx >= 0) {
        const timer = setTimeout(() => {
          cardScrollRef.current?.scrollTo({ x: activeIdx * cardWidth, animated: true });
        }, 80);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedLevelGroup, visibleGroups.length, cardWidth]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const username = userInfo?.username || 'Học viên';
  const selectedGrpData = groupsProgress.find((g) => g.id === selectedLevelGroup);
  const isSelectedGroupDone = Boolean(selectedGrpData?.isCompleted);
  const selectedGrpMeta = APP_LEVEL_GROUPS.find((g) => g.id === selectedLevelGroup) || APP_LEVEL_GROUPS[0];

  const overallProgress = selectedGrpData?.progressPercentage !== undefined
    ? selectedGrpData.progressPercentage
    : (courses.length > 0
        ? Math.round(courses.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / courses.length)
        : 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/gacon.gif')}
              style={[styles.avatar, { borderColor: theme.border }]}
            />
            <View>
              <Text style={[styles.greeting, { color: theme.text }]}>Xin chào, {username}!</Text>
              <View style={[styles.streakBadge, { backgroundColor: isDark ? '#451a03' : '#fff7ed', flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="flame" size={13} color={isDark ? '#fb923c' : '#ea580c'} style={{ marginRight: 4 }} />
                <Text style={[styles.streakText, { color: isDark ? '#fb923c' : '#ea580c' }]}>
                  {streak > 0 ? `${streak} ngày liên tiếp` : '0 ngày liên tiếp'}
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

        {/* CAROUSEL THẺ TIẾN TRÌNH CẤP ĐỘ (TỰ ĐỘNG THÊM THẺ & TRƯỢT NGANG KHI MỞ KHÓA LỘ TRÌNH MỚI) */}
        <View style={{ marginBottom: 20 }}>
          <ScrollView
            ref={cardScrollRef}
            horizontal
            pagingEnabled={visibleGroups.length > 1}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            style={{ width: cardWidth }}
            contentContainerStyle={{ alignItems: 'stretch' }}
            onScrollBeginDrag={() => {
              isUserSwipingRef.current = true;
            }}
            onMomentumScrollEnd={(e) => {
              isUserSwipingRef.current = false;
              const offsetX = e.nativeEvent.contentOffset.x;
              const pageIndex = Math.round(offsetX / cardWidth);
              const targetGroup = visibleGroups[pageIndex];
              if (targetGroup && targetGroup.id !== selectedLevelGroup) {
                handleSelectLevelGroup(targetGroup.id);
              }
            }}
          >
            {visibleGroups.map((item, index) => {
              const grpData = groupsProgress.find((g) => g.id === item.id);
              const isGroupDone = Boolean(grpData?.isCompleted);
              const isTarget = item.id === targetLevelGroup;
              const isViewing = item.id === selectedLevelGroup;

              const pct = grpData?.progressPercentage !== undefined
                ? grpData.progressPercentage
                : (isViewing && courses.length > 0
                    ? Math.round(courses.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / courses.length)
                    : 0);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.levelCard,
                    {
                      width: cardWidth,
                      marginBottom: 0,
                    },
                    isGroupDone
                      ? {
                          backgroundColor: isDark ? '#064e3b' : '#047857',
                          shadowColor: '#10b981',
                        }
                      : {
                          backgroundColor: '#4f46e5',
                          shadowColor: '#4f46e5',
                        },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                      {isGroupDone && (
                        <Ionicons name="ribbon" size={14} color="#facc15" />
                      )}
                      <Text style={styles.levelLabel} numberOfLines={1}>
                        {isGroupDone
                          ? 'BẠN ĐÃ TỐT NGHIỆP CẤP ĐỘ NÀY (ĐÃ HỌC)'
                          : isTarget
                          ? 'MỤC TIÊU HỌC CHÍNH HIỆN TẠI'
                          : 'MỤC TIÊU ĐANG XEM'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {/* Nút đặt làm cấp độ chính */}
                      {!isTarget && (
                        <TouchableOpacity
                          style={styles.setPrimaryBtn}
                          onPress={() => handleSetActivePrimaryLevelGroup(item.id)}
                        >
                          <Text style={styles.setPrimaryBtnText}>Đặt làm mục tiêu chính</Text>
                        </TouchableOpacity>
                      )}

                      {/* Huy hiệu chỉ số thẻ khi có nhiều hơn 1 lộ trình */}
                      {visibleGroups.length > 1 && (
                        <View style={styles.cardCounterBadge}>
                          <Ionicons name="swap-horizontal" size={12} color="rgba(255,255,255,0.85)" />
                          <Text style={styles.cardCounterText}>{index + 1}/{visibleGroups.length}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.levelTitle}>{item.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 10 }}>
                    {item.desc}
                  </Text>

                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>Tiến trình cấp độ</Text>
                    <Text style={styles.progressPercent}>{pct}%</Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: isGroupDone ? '#34d399' : '#ffffff',
                        },
                      ]}
                    />
                  </View>

                  {/* HÀNH ĐỘNG CỦA CẤP ĐỘ ĐÃ HỌC: XEM CHỨNG CHỈ & HỌC LẠI */}
                  {isGroupDone && (
                    <View style={styles.doneLevelActions}>
                      <TouchableOpacity
                        style={styles.certBtn}
                        onPress={() => openCertificate(item.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="ribbon" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                        <Text style={styles.certBtnText}>Xem chứng chỉ</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.relearnHeaderBtn}
                        onPress={() => handleRelearnLevel(item.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.relearnHeaderBtnText}>Học lại cấp độ</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* DẤU CHẤM ĐIỀU HƯỚNG TRƯỢT NGANG (KHI CÓ TỪ 2 LỘ TRÌNH TRỞ LÊN) */}
          {visibleGroups.length > 1 && (
            <View style={styles.cardPaginationContainer}>
              {visibleGroups.map((g, idx) => {
                const isSelected = g.id === selectedLevelGroup;
                const isCurrentGroupDone = Boolean(groupsProgress.find((gp) => gp.id === g.id)?.isCompleted);
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      handleSelectLevelGroup(g.id);
                      cardScrollRef.current?.scrollTo({ x: idx * cardWidth, animated: true });
                    }}
                    style={[
                      styles.paginationDot,
                      isSelected
                        ? [styles.paginationDotActive, { backgroundColor: isCurrentGroupDone ? '#10b981' : '#4f46e5' }]
                        : [styles.paginationDotInactive, { backgroundColor: isDark ? '#374151' : '#d1d5db' }],
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* 3. SỔ TAY TỪ VỰNG & ÔN TẬP SRS */}
        <View style={styles.vocabSectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="book" size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sổ tay từ vựng</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/saved-words')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>Xem lịch sử</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* 3 Ô SỐ LIỆU: TỔNG TỪ LƯU - CẦN ÔN HÔM NAY - THÀNH THẠO */}
          <View style={styles.vocabStatsRow}>
            <TouchableOpacity
              style={[styles.vocabStatCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push('/saved-words')}
              activeOpacity={0.8}
            >
              <Text style={[styles.vocabStatNumber, { color: theme.primary }]}>
                {vocabStats.totalSaved}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.subtext }]}>Tổng từ lưu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vocabStatCard,
                {
                  backgroundColor: theme.card,
                  borderColor: vocabStats.dueCount > 0 ? '#f59e0b' : theme.border,
                },
              ]}
              onPress={() => {
                if (vocabStats.dueCount > 0) {
                  startHomeReviewSession('due');
                } else {
                  router.push('/saved-words');
                }
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.vocabStatNumber,
                  { color: vocabStats.dueCount > 0 ? '#ef4444' : '#10b981' },
                ]}
              >
                {vocabStats.dueCount}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.subtext }]}>Cần ôn hôm nay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vocabStatCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push('/saved-words')}
              activeOpacity={0.8}
            >
              <Text style={[styles.vocabStatNumber, { color: '#10b981' }]}>
                {vocabStats.masteredCount}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.subtext }]}>Thành thạo</Text>
            </TouchableOpacity>
          </View>

          {/* THẺ LUYỆN TẬP VỚI NÚT ÔN TẬP TỪ VỰNG (SPACED REPETITION) */}
          <View
            style={[
              styles.homeSrsCard,
              {
                backgroundColor: vocabStats.dueCount > 0
                  ? (isDark ? '#451a03' : '#fef3c7')
                  : (isDark ? '#064e3b' : '#ecfdf5'),
                borderColor: vocabStats.dueCount > 0 ? '#f59e0b' : '#10b981',
              },
            ]}
          >
            <View style={styles.homeSrsCardHeader}>
              <View
                style={[
                  styles.homeSrsIconBox,
                  { backgroundColor: vocabStats.dueCount > 0 ? '#f59e0b' : '#10b981' },
                ]}
              >
                <Ionicons
                  name={vocabStats.dueCount > 0 ? 'alarm' : 'checkmark-circle'}
                  size={20}
                  color="#ffffff"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.homeSrsTitle,
                    { color: vocabStats.dueCount > 0 ? (isDark ? '#fef3c7' : '#92400e') : (isDark ? '#ecfdf5' : '#065f46') },
                  ]}
                >
                  {vocabStats.dueCount > 0
                    ? `Có ${vocabStats.dueCount} từ cần ôn tập hôm nay!`
                    : vocabStats.totalSaved > 0
                    ? 'Bạn đã hoàn thành các từ đến hạn!'
                    : 'Chưa có từ vựng nào trong sổ tay'}
                </Text>
                <Text
                  style={[
                    styles.homeSrsSub,
                    { color: vocabStats.dueCount > 0 ? (isDark ? '#fde68a' : '#b45309') : (isDark ? '#a7f3d0' : '#047857') },
                  ]}
                  numberOfLines={2}
                >
                  {vocabStats.dueCount > 0
                    ? 'Ôn tập ngắt quãng đúng hạn giúp ghi nhớ sâu vào phản xạ dài hạn.'
                    : vocabStats.totalSaved > 0
                    ? 'Hôm nay chưa có từ mới đến hạn. Bạn có thể luyện tập tự do bất kỳ lúc nào.'
                    : 'Bấm biểu tượng lưu từ trong các bài học để đưa từ vào sổ tay và luyện tập.'}
                </Text>
              </View>
            </View>

            <View style={styles.homeSrsActions}>
              {vocabStats.dueCount > 0 ? (
                <TouchableOpacity
                  style={[styles.homeReviewBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={() => startHomeReviewSession('due')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame" size={17} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.homeReviewBtnText}>Bắt đầu ôn tập ({vocabStats.dueCount} từ)</Text>
                </TouchableOpacity>
              ) : vocabStats.totalSaved > 0 ? (
                <TouchableOpacity
                  style={[styles.homeReviewBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => startHomeReviewSession('all')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.homeReviewBtnText}>Luyện tập tự do ({vocabStats.totalSaved} từ)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.homeReviewBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    if (courses.length > 0) {
                      router.push({ pathname: '/(tabs)/course/[id]', params: { id: courses[0].id } } as any);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="school" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.homeReviewBtnText}>Khám phá bài học & Lưu từ</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 4. GAME HUB & NHIỆM VỤ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: isDark ? '#1c1917' : '#fef3c7',
              padding: 15,
              borderRadius: 16,
              marginRight: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? '#44403c' : '#fde68a',
            }}
            onPress={() => {
              /* @ts-ignore */
              router.push('/games');
            }}
          >
            <Ionicons name="game-controller" size={32} color={isDark ? '#facc15' : '#d97706'} />
            <Text style={{ fontWeight: 'bold', color: isDark ? '#fbbf24' : '#b45309', marginTop: 8 }}>
              Giải Trí
            </Text>
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
              borderColor: isDark ? '#14532d' : '#bbf7d0',
            }}
            onPress={() => setQuestModalVisible(true)}
          >
            <Ionicons name="calendar" size={32} color={isDark ? '#4ade80' : '#15803d'} />
            <Text style={{ fontWeight: 'bold', color: isDark ? '#4ade80' : '#166534', marginTop: 8 }}>
              Nhiệm Vụ
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. CHỦ ĐỀ HỌC TẬP (VỚI CHẾ ĐỘ "HỌC LẠI" NẾU ĐÃ TỐT NGHIỆP) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Chủ đề học tập ({courses.length})
          </Text>
          {isSelectedGroupDone && (
            <View style={[styles.relearnBadge, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
              <Ionicons name="refresh" size={13} color="#10b981" />
              <Text style={[styles.relearnBadgeText, { color: isDark ? '#a7f3d0' : '#047857' }]}>
                Chế độ học lại
              </Text>
            </View>
          )}
        </View>

        <View style={styles.topicsContainer}>
          {courses.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="book-outline" size={40} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                Chưa có chủ đề nào ở {selectedGrpMeta.title}.
              </Text>
            </View>
          ) : (
            courses.map((course: any) => {
              const pct = course.progressPercentage || 0;
              const topicImg = getFullMediaUrl(course.imageUrl);

              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.topicCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    router.push({ pathname: '/(tabs)/course/[id]', params: { id: course.id } } as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicHeader}>
                    <View style={[styles.topicIconContainer, { backgroundColor: theme.cardSecondary, padding: 0, overflow: 'hidden' }]}>
                      <Image
                        source={topicImg ? { uri: topicImg } : require('../../../assets/images/gacon.gif')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.topicInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.topicTitle, { color: theme.text }]} numberOfLines={1}>
                          {course.title}
                        </Text>

                        {/* NÚT CHUYỂN SANG CHẾ ĐỘ "HỌC LẠI" NẾU ĐÃ HỌC */}
                        {isSelectedGroupDone ? (
                          <View style={[styles.topicRelearnBtn, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                            <Ionicons name="refresh" size={13} color="#10b981" />
                            <Text style={styles.topicRelearnBtnText}>Học lại</Text>
                          </View>
                        ) : (
                          <Text style={[styles.topicPercent, { color: pct > 0 ? '#10b981' : theme.subtext }]}>
                            {pct}%
                          </Text>
                        )}
                      </View>

                      <Text style={[styles.topicSubtitle, { color: theme.subtext }]}>
                        {course.completedLessons > 0
                          ? `${course.completedLessons}/${course.totalLessons} bài học đã học`
                          : `${course.totalLessons} bài học`}
                      </Text>

                      <View style={[styles.topicProgressBarBg, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                        <View
                          style={[
                            styles.topicProgressBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: isSelectedGroupDone ? '#10b981' : (pct > 0 ? '#10b981' : (isDark ? '#3f3f46' : '#e5e7eb')),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* BOTTOM BANNER - NHIỆM VỤ HÔM NAY */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setQuestModalVisible(true)}>
          <View style={styles.challengeBanner}>
            <View style={styles.challengeIconContainer}>
              <Ionicons name="ribbon-outline" size={28} color="#ffffff" />
            </View>
            <View style={styles.challengeInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="trophy" size={13} color="#fef08a" />
                <Text style={styles.challengeLabel}>THỬ THÁCH HÔM NAY</Text>
              </View>
              <Text style={styles.challengeTitle}>Chinh phục các nhiệm vụ hàng ngày để tích lũy XP!</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Chạm để xem tiến độ & nhận thưởng
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* POPUP CHÚC MỪNG & CẤP CHỨNG CHỈ (CERTIFICATE MODAL) */}
      <CertificateModal
        visible={certModalVisible}
        onClose={() => setCertModalVisible(false)}
        certificate={currentCertificate}
        onSelectNextLevel={(nextLvlGroup) => {
          handleSetActivePrimaryLevelGroup(nextLvlGroup);
          handleSelectLevelGroup(nextLvlGroup);
        }}
        onRelearn={() => {
          handleScrollToTopics();
        }}
      />

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

      {/* MODAL ÔN TẬP TỪ VỰNG (SPACED REPETITION) */}
      <VocabReviewModal
        visible={vocabReviewVisible}
        onClose={() => setVocabReviewVisible(false)}
        queue={vocabReviewQueue}
        onFinished={({ xpEarned }) => {
          fetchVocabData();
          if (userInfo && xpEarned > 0) {
            setUserInfo({ ...userInfo, xpPoints: (userInfo.xpPoints || 0) + xpEarned });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#e5e7eb', marginRight: 12 },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  streakBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  streakText: { fontSize: 11, fontWeight: 'bold' },
  notificationBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' },
  notifBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#ffffff' },
  notifBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  /* LEVEL CAROUSEL & LEVEL CARD */
  cardCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardCounterText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 22,
  },
  paginationDotInactive: {
    width: 6,
  },
  levelCard: {
    padding: 20,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  levelLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold' },
  setPrimaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  setPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  levelTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  progressPercent: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  doneLevelActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  certBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
  },
  certBtnText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: 'bold',
  },
  relearnHeaderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  relearnHeaderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  /* SECTION */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 5,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  relearnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relearnBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  topicsContainer: { marginBottom: 10 },
  topicCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12 },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIconContainer: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  topicPercent: { fontSize: 14, fontWeight: 'bold' },
  topicRelearnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  topicRelearnBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topicSubtitle: { fontSize: 12, marginBottom: 8 },
  topicProgressBarBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  topicProgressBarFill: { height: '100%', borderRadius: 2 },

  emptyBox: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  challengeBanner: { backgroundColor: '#ef4444', flexDirection: 'row', padding: 20, borderRadius: 16, marginTop: 10, alignItems: 'center' },
  challengeIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  challengeInfo: { flex: 1 },
  challengeLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  challengeTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', lineHeight: 22 },

  /* VOCAB DASHBOARD SECTION */
  vocabSectionContainer: {
    marginBottom: 20,
  },
  vocabStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vocabStatCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  vocabStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  homeSrsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  homeSrsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeSrsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeSrsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  homeSrsSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  homeSrsActions: {
    marginTop: 12,
  },
  homeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  homeReviewBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
