import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';

export default function SavedWordsScreen() {
  const router = useRouter();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const res = await axiosClient.get('/profile/saved-words');
      if (res.data?.success) setWords(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Từ vựng đã học</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : words.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Chưa có từ vựng nào được học</Text>
          </View>
        ) : (
          words.map((item, idx) => (
            <View key={idx} style={styles.wordCard}>
              <View style={styles.info}>
                <Text style={styles.headword}>{item.word?.headword}</Text>
                <Text style={styles.pronunciation}>{item.word?.pronunciation}</Text>
                <Text style={styles.meaning}>{item.word?.meaning}</Text>
              </View>
              <View style={styles.statusBox}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.statusText}>Level {item.memoryLevel}</Text>
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
  wordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  info: { flex: 1 },
  headword: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  pronunciation: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginBottom: 4 },
  meaning: { fontSize: 15, color: '#111827' },
  statusBox: { alignItems: 'center', backgroundColor: '#fef3c7', padding: 8, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#d97706', marginTop: 2 }
});
