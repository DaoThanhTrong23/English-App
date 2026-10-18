import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';
import { useAppTheme } from '../../context/ThemeContext';

export default function LeaderboardScreen() {
  const { isDark, theme } = useAppTheme();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('userInfo');
        if (storedUser) setUserInfo(JSON.parse(storedUser));
        const storedAvatar = await SecureStore.getItemAsync('userAvatar');
        if (storedAvatar) setAvatarUri(storedAvatar);
        
        // Fetch Leaderboard
        const res = await axiosClient.get('/student/leaderboard');
        if (res.data?.success) {
          setLeaderboardData(res.data.data);
        }
      } catch (error) {
        console.log("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const username = userInfo?.username || "Bạn";

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const topUsers = leaderboardData?.topUsers || [];
  const currentRank = leaderboardData?.currentUser?.rank || '--';
  const currentXp = leaderboardData?.currentUser?.xpPoints || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Bảng xếp hạng</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Thi đua học tập cùng bạn bè</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {topUsers.length === 0 ? (
           <View style={styles.emptyState}>
             <Ionicons name="trophy-outline" size={48} color={theme.subtext} />
             <Text style={[styles.emptyTitle, { color: theme.subtext }]}>Chưa có dữ liệu xếp hạng</Text>
           </View>
        ) : (
          topUsers.map((user: any, index: number) => {
            const rank = index + 1;
            let rankColor = theme.subtext;
            if (rank === 1) rankColor = '#fbbf24';
            if (rank === 2) rankColor = '#94a3b8';
            if (rank === 3) rankColor = '#b45309';

            return (
              <View key={user.id} style={[styles.rankCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.rankNumber, {color: rank <= 3 ? rankColor : theme.subtext}]}>{rank}</Text>
                <Image 
                  source={user.avatarUrl ? { uri: user.avatarUrl.startsWith('http') ? user.avatarUrl : baseURL + user.avatarUrl } : require('../../../assets/images/gacon.gif')} 
                  style={[styles.rankAvatar, { backgroundColor: theme.cardSecondary }]} 
                />
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankName, { color: theme.text }]}>{user.username}</Text>
                  <Text style={[styles.rankLevel, { color: theme.subtext }]}>Level {user.cefrLevel || 'A1'}</Text>
                </View>
                <Text style={styles.rankXp}>{user.xpPoints} XP</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Current User Rank Sticky */}
      <View style={[styles.currentUserCard, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <Text style={[styles.currentUserRank, { color: theme.primary }]}>{currentRank}</Text>
        <Image 
          source={avatarUri ? { uri: avatarUri.startsWith('http') ? avatarUri : baseURL + avatarUri } : require('../../../assets/images/gacon.gif')} 
          style={[styles.rankAvatar, { backgroundColor: theme.cardSecondary }]} 
        />
        <View style={styles.rankInfo}>
          <Text style={[styles.currentUserName, { color: theme.text }]}>{username}</Text>
          <Text style={[styles.currentUserStatus, { color: theme.primary }]}>Hạng của bạn</Text>
        </View>
        <Text style={styles.currentUserXp}>{currentXp} XP</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#ffffff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 15, color: '#9ca3af', marginTop: 10 },

  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  rankNumber: { width: 30, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  rankAvatar: { width: 45, height: 45, borderRadius: 25, marginHorizontal: 12, backgroundColor: '#f3f4f6' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  rankLevel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rankXp: { fontSize: 15, fontWeight: 'bold', color: '#d97706' },

  currentUserCard: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  currentUserRank: { width: 30, fontSize: 18, fontWeight: 'bold', color: '#3b82f6', textAlign: 'center' },
  currentUserName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  currentUserStatus: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  currentUserXp: { fontSize: 15, fontWeight: 'bold', color: '#d97706' },
});
