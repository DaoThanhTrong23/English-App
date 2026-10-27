import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';
import { getFullMediaUrl } from '../utils/media';

export default function AchievementsScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [userAch, setUserAch] = useState<any[]>([]);
  const [allAch, setAllAch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get('/profile/achievements');
      if (res.data?.success) {
        setUserAch(res.data.data.userAchievements || []);
        setAllAch(res.data.data.allAchievements || []);
      }
    } catch (error) {
      console.log('Lỗi tải danh hiệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achId: number) => {
    return userAch.some(ua => ua.achievementId === achId);
  };

  const isImageUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.trim().toLowerCase();
    return (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('/uploads/') ||
      lower.startsWith('uploads/') ||
      lower.includes('/') ||
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.svg')
    );
  };

  const renderAchievementIcon = (item: any, unlocked: boolean) => {
    const isImg = isImageUrl(item.iconUrl);
    const mediaUrl = isImg ? getFullMediaUrl(item.iconUrl) : null;

    if (mediaUrl) {
      return (
        <View style={[
          styles.iconBox, 
          { backgroundColor: unlocked ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#27272a' : '#f3f4f6') }
        ]}>
          <Image 
            source={{ uri: mediaUrl }} 
            style={[styles.achievementImg, !unlocked && styles.lockedImg]} 
            resizeMode="contain" 
          />
          {!unlocked && (
            <View style={[styles.lockBadgeOverlay, { borderColor: isDark ? '#18181b' : '#ffffff' }]}>
              <Ionicons name="lock-closed" size={11} color="#ffffff" />
            </View>
          )}
        </View>
      );
    }

    // Fallback sang biểu tượng Ionicons nếu là tên icon thông thường
    const iconName = (!isImg && item.iconUrl) ? item.iconUrl : (unlocked ? 'trophy' : 'lock-closed');
    return (
      <View style={[
        styles.iconBox, 
        { backgroundColor: unlocked ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#27272a' : '#f3f4f6') }
      ]}>
        <Ionicons 
          name={unlocked ? (iconName as any) : 'lock-closed'} 
          size={24} 
          color={unlocked ? '#d97706' : (isDark ? '#71717a' : '#9ca3af')} 
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Thành tựu của bạn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARD */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#18181b' : '#1e3a8a', borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryTitle}>Tiến trình danh hiệu</Text>
              <Text style={[styles.summarySubtitle, { color: isDark ? '#a1a1aa' : '#93c5fd' }]}>
                Đã mở khóa {userAch.length}/{allAch.length} thành tựu
              </Text>
            </View>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={28} color="#fbbf24" />
            </View>
          </View>
          <View style={styles.summaryBarBg}>
            <View 
              style={[
                styles.summaryBarFill, 
                { width: allAch.length > 0 ? `${Math.round((userAch.length / allAch.length) * 100)}%` : '0%' }
              ]} 
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
        ) : allAch.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>Hệ thống chưa có thành tựu nào</Text>
          </View>
        ) : (
          allAch.map((item, idx) => {
            const unlocked = isUnlocked(item.id);
            return (
              <View 
                key={item.id || idx} 
                style={[
                  styles.card, 
                  { backgroundColor: unlocked ? theme.card : (isDark ? '#141416' : '#f9fafb'), borderColor: theme.border },
                  !unlocked && styles.cardLocked
                ]}
              >
                {renderAchievementIcon(item, unlocked)}

                <View style={styles.info}>
                  <Text style={[styles.title, { color: unlocked ? theme.text : theme.subtext }]}>
                    {item.title || item.name}
                  </Text>
                  <Text style={[styles.desc, { color: theme.subtext }]}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="trophy-outline" size={13} color={unlocked ? '#d97706' : theme.subtext} />
                    <Text style={[styles.reqText, { color: unlocked ? (isDark ? '#f59e0b' : '#b45309') : theme.subtext, marginTop: 0 }]}>
                      {item.requireXp} XP
                    </Text>
                    {item.requireStreak > 1 && (
                      <>
                        <Text style={[styles.reqText, { color: theme.subtext, marginTop: 0, marginHorizontal: 2 }]}>•</Text>
                        <Ionicons name="flame" size={13} color="#ea580c" />
                        <Text style={[styles.reqText, { color: unlocked ? '#ea580c' : theme.subtext, marginTop: 0 }]}>
                          {item.requireStreak} ngày streak
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {unlocked ? (
                  <View style={[styles.badge, { backgroundColor: isDark ? '#052e16' : '#dcfce7' }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#16a34a" style={{ marginRight: 3 }} />
                    <Text style={styles.badgeText}>Đã đạt</Text>
                  </View>
                ) : (
                  <View style={[styles.badgeLocked, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                    <Ionicons name="lock-closed" size={10} color={theme.subtext} style={{ marginRight: 3 }} />
                    <Text style={[styles.badgeLockedText, { color: theme.subtext }]}>Khóa</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },

  summaryCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  summarySubtitle: { fontSize: 13, marginTop: 4 },
  trophyCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  summaryBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  summaryBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 4 },

  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10 },

  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3 
  },
  cardLocked: { opacity: 0.8 },
  iconBox: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
    position: 'relative'
  },
  achievementImg: {
    width: 38,
    height: 38
  },
  lockedImg: {
    opacity: 0.35
  },
  lockBadgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#64748b',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  reqText: { fontSize: 11, fontWeight: '600' },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },
  badgeLocked: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  badgeLockedText: { fontSize: 11, fontWeight: 'bold' }
});
