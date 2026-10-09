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

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : allAch.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Hệ thống chưa có thành tựu nào</Text>
          </View>
        ) : (
          allAch.map((item, idx) => {
            const unlocked = isUnlocked(item.id);
            return (
              <View key={idx} style={[styles.card, !unlocked && styles.cardLocked]}>
                <View style={[styles.iconBox, { backgroundColor: unlocked ? '#fef3c7' : '#f3f4f6' }]}>
                  <Ionicons name={unlocked ? "trophy" : "lock-closed"} size={24} color={unlocked ? "#d97706" : "#9ca3af"} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.title, !unlocked && {color: '#9ca3af'}]}>{item.name}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </View>
                {unlocked && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Đã mở khóa</Text>
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
  content: { padding: 20 },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#6b7280' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardLocked: { opacity: 0.7, backgroundColor: '#f9fafb' },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6b7280' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' }
});
