import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';

export default function HistoryScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'tests' | 'adaptive'>('tests');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get('/profile/history');
      if (res.data?.success && res.data.data) {
        setTestResults(res.data.data.testResults || []);
        setAssessmentHistory(res.data.data.assessmentHistory || []);
      }
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} • ${day}/${month}/${year}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lịch sử học tập & Kiểm tra</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SEGMENTED TABS */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'tests' && [styles.tabButtonActive, { backgroundColor: isDark ? '#1c2438' : '#eff6ff', borderColor: isDark ? '#2563eb' : '#bfdbfe' }]
          ]}
          onPress={() => setActiveTab('tests')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={18} 
            color={activeTab === 'tests' ? theme.primary : theme.subtext} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'tests' ? theme.primary : theme.subtext }, activeTab === 'tests' && styles.tabTextActive]}>
            Bài kiểm tra ({testResults.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'adaptive' && [styles.tabButtonActive, { backgroundColor: isDark ? '#1c2438' : '#eff6ff', borderColor: isDark ? '#2563eb' : '#bfdbfe' }]
          ]}
          onPress={() => setActiveTab('adaptive')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={18} 
            color={activeTab === 'adaptive' ? theme.primary : theme.subtext} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'adaptive' ? theme.primary : theme.subtext }, activeTab === 'adaptive' && styles.tabTextActive]}>
            Đánh giá FAME-KT ({assessmentHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'tests' ? (
          /* TAB 1: BÀI KIỂM TRA BÀI HỌC */
          testResults.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.cardSecondary }]}>
                <Ionicons name="school-outline" size={40} color={theme.subtext} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có bài kiểm tra nào</Text>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>Hoàn thành các bài kiểm tra trong mỗi bài học để ghi lại điểm số tại đây!</Text>
            </View>
          ) : (
            testResults.map((item, idx) => (
              <View key={item.id || idx} style={[styles.testCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.testCardTop}>
                  <View style={[styles.testBadgeIcon, { backgroundColor: isDark ? '#1c2438' : '#eff6ff' }]}>
                    <Ionicons name="ribbon" size={22} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.testTitle, { color: theme.text }]} numberOfLines={2}>
                      {item.test?.title || 'Bài kiểm tra kiến thức'}
                    </Text>
                    {item.test?.lesson?.title && (
                      <Text style={[styles.lessonName, { color: theme.subtext }]} numberOfLines={1}>
                        📖 {item.test.lesson.title}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.scoreContainer, { backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderColor: isDark ? '#166534' : '#bbf7d0' }]}>
                    <Text style={styles.scoreValue}>+{Number(item.totalScore) || 0}</Text>
                    <Text style={styles.scoreUnit}>Điểm</Text>
                  </View>
                </View>

                <View style={[styles.testCardBottom, { borderTopColor: theme.border }]}>
                  <View style={styles.timeTag}>
                    <Ionicons name="time-outline" size={14} color={theme.subtext} style={{ marginRight: 4 }} />
                    <Text style={[styles.timeText, { color: theme.subtext }]}>{formatTime(item.completedAt)}</Text>
                  </View>
                  <View style={[styles.passedTag, { backgroundColor: isDark ? '#052e16' : '#f0fdf4' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 4 }} />
                    <Text style={styles.passedText}>Đã hoàn thành</Text>
                  </View>
                </View>
              </View>
            ))
          )
        ) : (
          /* TAB 2: ĐÁNH GIÁ THÍCH ỨNG FAME-KT */
          assessmentHistory.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.cardSecondary }]}>
                <Ionicons name="analytics-outline" size={40} color={theme.subtext} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có câu hỏi đánh giá nào</Text>
              <Text style={[styles.emptyText, { color: theme.subtext }]}>Làm bài test phân loại ban đầu hoặc kiểm tra trình độ để xem dữ liệu FAME-KT.</Text>
            </View>
          ) : (
            assessmentHistory.map((item, idx) => (
              <View key={item.id || idx} style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconBox, { backgroundColor: item.isCorrect ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#450a0a' : '#fee2e2') }]}>
                  <Ionicons 
                    name={item.isCorrect ? "checkmark" : "close"} 
                    size={20} 
                    color={item.isCorrect ? "#16a34a" : "#ef4444"} 
                  />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                    {item.question?.quesionText || "Câu hỏi đánh giá trình độ"}
                  </Text>
                  <View style={styles.metaRow}>
                    {item.question?.skillCategory && (
                      <View style={[styles.categoryBadge, { backgroundColor: theme.cardSecondary }]}>
                        <Text style={[styles.categoryBadgeText, { color: theme.subtext }]}>{item.question.skillCategory}</Text>
                      </View>
                    )}
                    <Text style={[styles.time, { color: theme.subtext }]}>
                      {(item.timeTakenMs / 1000).toFixed(1)}s • {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.eloBox}>
                  <Text style={[styles.eloLabel, { color: theme.subtext }]}>Elo sau test</Text>
                  <Text style={[styles.eloValue, { color: theme.primary }]}>{item.avgEloAfter || 1200}</Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },

  content: { padding: 16, paddingBottom: 40 },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  emptyText: { textAlign: 'center', fontSize: 13, lineHeight: 20 },

  /* Test Card Styles */
  testCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  testCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lessonName: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  scoreUnit: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '600',
  },
  testCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  passedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  passedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },

  /* Assessment History Item */
  historyCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  time: { fontSize: 11 },
  eloBox: { alignItems: 'flex-end', marginLeft: 8 },
  eloLabel: { fontSize: 10, marginBottom: 2 },
  eloValue: { fontSize: 14, fontWeight: 'bold' }
});
