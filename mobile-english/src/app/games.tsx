import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function GamesHubScreen() {
  const router = useRouter();

  const games = [
    { id: 'bubble-game', name: 'Bong Bóng Từ Vựng', icon: 'water', color: '#3b82f6', desc: 'Luyện phản xạ từ vựng nhanh' },
    { id: 'memory-card', name: 'Thẻ Nhớ Ma Thuật', icon: 'grid', color: '#8b5cf6', desc: 'Rèn luyện trí nhớ siêu phàm' },
    { id: 'word-matching', name: 'Nối Từ Tuyệt Đỉnh', icon: 'git-network', color: '#10b981', desc: 'Ghép cặp từ và nghĩa' },
    { id: 'mario', name: 'Mario Phóng Thoát', icon: 'mic', color: '#ef4444', desc: 'Đọc to tiếng Anh để vượt chướng ngại vật' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Góc Giải Trí</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Ionicons name="game-controller" size={48} color="#fbbf24" style={{marginBottom: 10}} />
          <Text style={styles.bannerTitle}>Học mà chơi, chơi mà học!</Text>
          <Text style={styles.bannerDesc}>Vượt qua các thử thách Mini Game để kiếm thêm nhiều XP và củng cố từ vựng nhé.</Text>
        </View>

        <Text style={styles.sectionTitle}>Danh sách Trò chơi</Text>
        
        {games.map(game => (
          <TouchableOpacity key={game.id} style={styles.gameCard} onPress={() => { router.push(`/game/${game.id}` as any) }}>
            <View style={[styles.iconBox, { backgroundColor: game.color + '20' }]}>
              <Ionicons name={game.icon as any} size={28} color={game.color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDesc}>{game.desc}</Text>
            </View>
            <Ionicons name="play-circle" size={32} color="#f59e0b" />
          </TouchableOpacity>
        ))}
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
  banner: { backgroundColor: '#fffbeb', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#fde68a' },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#b45309', marginBottom: 5 },
  bannerDesc: { fontSize: 14, color: '#d97706', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  gameName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  gameDesc: { fontSize: 13, color: '#6b7280' }
});
