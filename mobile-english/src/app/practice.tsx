import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import GopPractice from '@/components/GopPractices';

export interface WordPracticeItem {
  id: number;
  word: string;
  ipa: string;
  meaning: string;
  type: string;
  difficulty: string;
  note: string;
}

const INITIAL_WORDS: WordPracticeItem[] = [
  { id: 1, word: "Hello", ipa: "/həˈloʊ/", meaning: "Xin chào", type: "Interjection", difficulty: "Dễ", note: "Chú ý nguyên âm đôi /oʊ/ ở âm cuối" },
  { id: 2, word: "Knight", ipa: "/naɪt/", meaning: "Hiệp sĩ", type: "Noun", difficulty: "Trung bình", note: "Chữ 'K' và 'GH' là âm câm" },
  { id: 3, word: "Doubt", ipa: "/daʊt/", meaning: "Nghi ngờ", type: "Noun", difficulty: "Trung bình", note: "Chữ 'B' là âm câm" },
  { id: 4, word: "Comfortable", ipa: "/ˈkʌm.fər.tə.bəl/", meaning: "Thoải mái", type: "Adjective", difficulty: "Khó", note: "Trọng âm ở âm đầu" },
  { id: 5, word: "Psychology", ipa: "/saɪˈkɒl.ə.dʒi/", meaning: "Tâm lý học", type: "Noun", difficulty: "Khó", note: "Chữ 'P' là âm câm" },
  { id: 6, word: "Schedule", ipa: "/ˈskedʒ.uːl/", meaning: "Lịch trình", type: "Noun", difficulty: "Khó", note: "Âm /sk/ và /dʒ/ bật rõ ràng" },
];

export default function PracticeTabScreen() {
  const [words] = useState<WordPracticeItem[]>(INITIAL_WORDS);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentWord = words[currentIndex] || words[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Luyện Phát Âm GOP AI</Text>
          <Text style={styles.subtitle}>
            Từ {currentIndex + 1} / {words.length}
          </Text>
        </View>

        {/* Thanh chọn nhanh từ vựng ngang */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorScroll}
        >
          {words.map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              style={[
                styles.chip,
                idx === currentIndex && styles.chipActive,
              ]}
              onPress={() => setCurrentIndex(idx)}
            >
              <Text
                style={[
                  styles.chipText,
                  idx === currentIndex && styles.chipTextActive,
                ]}
              >
                {item.word}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Thẻ thông tin từ vựng */}
        <View style={styles.infoBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.typeBadge}>{currentWord.type || 'Word'}</Text>
            <Text
              style={[
                styles.diffBadge,
                currentWord.difficulty === 'Dễ' || currentWord.difficulty === 'A1'
                  ? styles.diffEasy
                  : currentWord.difficulty === 'Khó' || currentWord.difficulty === 'C1'
                  ? styles.diffHard
                  : styles.diffMedium,
              ]}
            >
              {currentWord.difficulty}
            </Text>
          </View>
          <Text style={styles.meaningText}>Nghĩa: {currentWord.meaning}</Text>
          {currentWord.note ? (
            <Text style={styles.noteText}>💡 {currentWord.note}</Text>
          ) : null}
        </View>

        {/* Component thu âm & gửi lên Backend chấm điểm */}
        <View style={styles.cardWrapper}>
          <GopPractice
            key={currentWord.word}
            word={currentWord.word}
            ipa={currentWord.ipa}
          />
        </View>

        {/* Nút chuyển từ Trước / Sau */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.btnNav, currentIndex === 0 && styles.btnDisabled]}
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <Text style={styles.btnNavText}>⬅️ Từ trước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnNav,
              currentIndex === words.length - 1 && styles.btnDisabled,
            ]}
            onPress={() =>
              setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1))
            }
            disabled={currentIndex === words.length - 1}
          >
            <Text style={styles.btnNavText}>Từ tiếp theo ➡️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  selectorScroll: { paddingVertical: 8, gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  infoBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    fontSize: 12,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  diffBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  diffEasy: { backgroundColor: '#dcfce7', color: '#166534' },
  diffMedium: { backgroundColor: '#fef9c3', color: '#854d0e' },
  diffHard: { backgroundColor: '#fee2e2', color: '#991b1b' },
  meaningText: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
  noteText: { fontSize: 13, color: '#b45309', marginTop: 6, fontStyle: 'italic' },
  cardWrapper: { width: '100%', marginBottom: 20 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  btnNav: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnDisabled: { opacity: 0.4 },
  btnNavText: { fontSize: 14, fontWeight: '600', color: '#334155' },
});
