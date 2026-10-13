import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';

export default function AchievementsScreen() {
  const router = useRouter();
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
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achId: number) => {
    return userAch.some(ua => ua.achievementId === achId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành tựu của bạn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryTitle}>Tiến trình danh hiệu</Text>
              <Text style={styles.summarySubtitle}>Đã mở khóa {userAch.length}/{allAch.length} thành tựu</Text>
            </View>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={28} color="#d97706" />
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
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : allAch.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Hệ thống chưa có thành tựu nào</Text>
          </View>
        ) : (
          allAch.map((item, idx) => {
            const unlocked = isUnlocked(item.id);
            const iconName = item.iconUrl || (unlocked ? "trophy" : "lock-closed");
            return (
              <View key={idx} style={[styles.card, !unlocked && styles.cardLocked]}>
                <View style={[styles.iconBox, { backgroundColor: unlocked ? '#fef3c7' : '#f3f4f6' }]}>
                  <Ionicons 
                    name={unlocked ? (iconName as any) : "lock-closed"} 
                    size={24} 
                    color={unlocked ? "#d97706" : "#9ca3af"} 
                  />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.title, !unlocked && {color: '#6b7280'}]}>
                    {item.title || item.name}
                  </Text>
                  <Text style={styles.desc}>{item.description}</Text>
                  <Text style={styles.reqText}>
                    🎯 {item.requireXp} XP {item.requireStreak > 1 ? `• 🔥 ${item.requireStreak} ngày streak` : ''}
                  </Text>
                </View>
                {unlocked ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Đã đạt</Text>
                  </View>
                ) : (
                  <View style={styles.badgeLocked}>
                    <Text style={styles.badgeLockedText}>Khóa</Text>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 20, paddingBottom: 40 },

  summaryCard: { backgroundColor: '#1e3a8a', padding: 20, borderRadius: 16, marginBottom: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  summarySubtitle: { color: '#93c5fd', fontSize: 13, marginTop: 4 },
  trophyCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  summaryBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  summaryBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 4 },

  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#6b7280' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3 },
  cardLocked: { opacity: 0.75, backgroundColor: '#f9fafb' },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 3 },
  desc: { fontSize: 13, color: '#4b5563', lineHeight: 18, marginBottom: 4 },
  reqText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },
  badgeLocked: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeLockedText: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af' }
});
