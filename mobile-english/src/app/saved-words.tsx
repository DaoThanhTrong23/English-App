import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { axiosClient } from '../api/axiosClient';

export default function SavedWordsScreen() {
  const router = useRouter();
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const playPronunciation = (text: string) => {
    if (!text) return;
    Speech.speak(text, { language: 'en-US', rate: 0.85 });
  };

  const filteredWords = words.filter(item => {
    const headword = item.word?.headword?.toLowerCase() || '';
    const meaning = item.word?.meaning?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return headword.includes(query) || meaning.includes(query);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Từ vựng đã học ({words.length})</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBoxContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" style={{marginRight: 8}} />
          <TextInput
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : filteredWords.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy từ vựng phù hợp' : 'Chưa có từ vựng nào được học'}
            </Text>
          </View>
        ) : (
          filteredWords.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.wordCard} 
              activeOpacity={0.7}
              onPress={() => playPronunciation(item.word?.headword)}
            >
              <View style={styles.info}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.headword}>{item.word?.headword}</Text>
                  <TouchableOpacity 
                    onPress={() => playPronunciation(item.word?.headword)}
                    style={styles.speakBtn}
                  >
                    <Ionicons name="volume-high" size={18} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pronunciation}>{item.word?.pronunciation || item.word?.phonetic}</Text>
                <Text style={styles.meaning}>{item.word?.meaning}</Text>
              </View>
              <View style={styles.statusBox}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.statusText}>Level {item.memoryLevel || 1}</Text>
              </View>
            </TouchableOpacity>
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
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#d97706', marginTop: 2 },
  searchBoxContainer: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  speakBtn: { padding: 4, marginLeft: 8, backgroundColor: '#eff6ff', borderRadius: 12 }
});
