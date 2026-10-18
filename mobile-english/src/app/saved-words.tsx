import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';

export default function SavedWordsScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Từ vựng đã học ({words.length})</Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBoxContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]}>
          <Ionicons name="search" size={20} color={theme.subtext} style={{marginRight: 8}} />
          <TextInput
            placeholder="Tìm kiếm từ hoặc nghĩa..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.inputText }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : filteredWords.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              {searchQuery ? 'Không tìm thấy từ vựng phù hợp' : 'Chưa có từ vựng nào được học'}
            </Text>
          </View>
        ) : (
          filteredWords.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.wordCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
              activeOpacity={0.7}
              onPress={() => playPronunciation(item.word?.headword)}
            >
              <View style={styles.info}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={[styles.headword, { color: theme.primary }]}>{item.word?.headword}</Text>
                  <TouchableOpacity 
                    onPress={() => playPronunciation(item.word?.headword)}
                    style={[styles.speakBtn, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}
                  >
                    <Ionicons name="volume-high" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.pronunciation, { color: theme.subtext }]}>{item.word?.pronunciation || item.word?.phonetic}</Text>
                <Text style={[styles.meaning, { color: theme.text }]}>{item.word?.meaning}</Text>
              </View>
              <View style={[styles.statusBox, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={[styles.statusText, { color: isDark ? '#fbbf24' : '#d97706' }]}>Level {item.memoryLevel || 1}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  content: { padding: 20 },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10 },
  wordCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  info: { flex: 1 },
  headword: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  pronunciation: { fontSize: 13, fontStyle: 'italic', marginBottom: 4 },
  meaning: { fontSize: 15 },
  statusBox: { alignItems: 'center', padding: 8, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  searchBoxContainer: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14 },
  speakBtn: { padding: 4, marginLeft: 8, borderRadius: 12 }
});
