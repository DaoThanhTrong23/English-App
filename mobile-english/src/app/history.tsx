import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/profile/history');
      if (res.data?.success) setHistory(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours()}:${d.getMinutes()} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử bài kiểm tra</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa có lịch sử làm bài</Text>
          </View>
        ) : (
          history.map((item, idx) => (
            <View key={idx} style={styles.historyCard}>
              <View style={[styles.iconBox, { backgroundColor: item.isCorrect ? '#dcfce7' : '#fee2e2' }]}>
                <Ionicons name={item.isCorrect ? "checkmark" : "close"} size={20} color={item.isCorrect ? "#16a34a" : "#ef4444"} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.question?.quesionText || "Câu hỏi ẩn"}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)} • {(item.timeTakenMs / 1000).toFixed(1)}s</Text>
              </View>
              <View style={styles.eloBox}>
                <Text style={styles.eloLabel}>Elo sau Test</Text>
                <Text style={styles.eloValue}>{item.avgEloAfter}</Text>
              </View>
            </View>
          ))
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
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  time: { fontSize: 12, color: '#6b7280' },
  eloBox: { alignItems: 'flex-end', marginLeft: 10 },
  eloLabel: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
  eloValue: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6' }
});
