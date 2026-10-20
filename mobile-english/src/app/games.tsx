import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';

export default function GamesHubScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const games = [
    { id: 'bubble-game', code: 'BUBBLE', name: 'Bong Bóng Từ Vựng', icon: 'water', color: '#3b82f6', desc: 'Luyện phản xạ từ vựng nhanh' },
    { id: 'memory-card', code: 'MEMORY', name: 'Thẻ Nhớ Ma Thuật', icon: 'grid', color: '#8b5cf6', desc: 'Rèn luyện trí nhớ siêu phàm' },
    { id: 'word-matching', code: 'MATCHING', name: 'Nối Từ Tuyệt Đỉnh', icon: 'git-network', color: '#10b981', desc: 'Ghép cặp từ và nghĩa' },
    { id: 'mario', code: 'MARIO', name: 'Mario Phóng Thoát', icon: 'mic', color: '#ef4444', desc: 'Đọc to tiếng Anh để vượt chướng ngại vật' }
  ];

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const res = await axiosClient.get('/games/history');
      if (res.data?.data?.stats) {
        setStats(res.data.data.stats);
      }
    } catch (e) {
      console.log('Lỗi lấy thống kê game:', e);
    } finally {
      setLoading(false);
    }
  };

  const getGameStat = (code: string) => {
    return stats.find(s => s.gameCode === code);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Góc Giải Trí</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: isDark ? '#18181b' : '#1e3a8a', borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}>
          <Ionicons name="game-controller" size={48} color="#fbbf24" style={{marginBottom: 10}} />
          <Text style={styles.bannerTitle}>Học mà chơi, chơi mà học!</Text>
          <Text style={[styles.bannerDesc, { color: isDark ? '#a1a1aa' : '#bfdbfe' }]}>Vượt qua các thử thách Mini Game để kiếm thêm nhiều XP và củng cố từ vựng nhé.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Danh sách Trò chơi & Thành tích</Text>
        
        {loading ? <ActivityIndicator size="large" color="#fbbf24" style={{marginTop: 20}} /> : 
        games.map(game => {
          const gameStat = getGameStat(game.code);
          return (
            <TouchableOpacity 
              key={game.id} 
              style={[styles.gameCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} 
              onPress={() => { router.push(`/game/${game.id}` as any) }}
            >
              <View style={[styles.iconBox, { backgroundColor: game.color + '20' }]}>
                <Ionicons name={game.icon as any} size={28} color={game.color} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.gameName, { color: theme.text }]}>{game.name}</Text>
                <Text style={[styles.gameDesc, { color: theme.subtext }]}>{game.desc}</Text>
                {gameStat ? (
                  <View style={styles.statRow}>
                    <View style={[styles.statBadge, { backgroundColor: theme.cardSecondary }]}>
                      <Ionicons name="trophy" size={12} color="#f59e0b" style={{ marginRight: 3 }} />
                      <Text style={[styles.statBadgeText, { color: theme.subtext }]}>
                        Kỷ lục: <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>{gameStat._max.score}</Text> điểm
                      </Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: theme.cardSecondary }]}>
                      <Ionicons name="game-controller" size={12} color={theme.subtext} style={{ marginRight: 3 }} />
                      <Text style={[styles.statBadgeText, { color: theme.subtext }]}>
                        Đã chơi: <Text style={{ fontWeight: 'bold', color: theme.text }}>{gameStat._count.id}</Text> lần
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.statTextEmpty, { color: theme.subtext }]}>Chưa chơi lần nào</Text>
                )}
              </View>
              <Ionicons name="play-circle" size={32} color={game.color} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  banner: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 25 },
  bannerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 5 },
  bannerDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  gameCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3 },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  gameDesc: { fontSize: 12, marginBottom: 6 },
  statRow: { flexDirection: 'row', gap: 10 },
  statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statBadgeText: { fontSize: 11 },
  statText: { fontSize: 11, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  statTextEmpty: { fontSize: 11, fontStyle: 'italic' }
});
