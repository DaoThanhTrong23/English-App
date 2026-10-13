import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { axiosClient } from '../api/axiosClient';

export default function HistoryScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử học tập & Kiểm tra</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* SEGMENTED TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'tests' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tests')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={18} 
            color={activeTab === 'tests' ? '#2563eb' : '#6b7280'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>
            Bài kiểm tra ({testResults.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'adaptive' && styles.tabButtonActive]}
          onPress={() => setActiveTab('adaptive')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={18} 
            color={activeTab === 'adaptive' ? '#2563eb' : '#6b7280'} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabText, activeTab === 'adaptive' && styles.tabTextActive]}>
            Đánh giá FAME-KT ({assessmentHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : activeTab === 'tests' ? (
          /* TAB 1: BÀI KIỂM TRA BÀI HỌC */
          testResults.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="school-outline" size={40} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có bài kiểm tra nào</Text>
              <Text style={styles.emptyText}>Hoàn thành các bài kiểm tra trong mỗi bài học để ghi lại điểm số tại đây!</Text>
            </View>
          ) : (
            testResults.map((item, idx) => (
              <View key={item.id || idx} style={styles.testCard}>
                <View style={styles.testCardTop}>
                  <View style={styles.testBadgeIcon}>
                    <Ionicons name="ribbon" size={22} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.testTitle} numberOfLines={2}>
                      {item.test?.title || 'Bài kiểm tra kiến thức'}
                    </Text>
                    {item.test?.lesson?.title && (
                      <Text style={styles.lessonName} numberOfLines={1}>
                        📖 {item.test.lesson.title}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreValue}>+{Number(item.totalScore) || 0}</Text>
                    <Text style={styles.scoreUnit}>Điểm</Text>
                  </View>
                </View>

                <View style={styles.testCardBottom}>
                  <View style={styles.timeTag}>
                    <Ionicons name="time-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                    <Text style={styles.timeText}>{formatTime(item.completedAt)}</Text>
                  </View>
                  <View style={styles.passedTag}>
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="analytics-outline" size={40} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có câu hỏi đánh giá nào</Text>
              <Text style={styles.emptyText}>Làm bài test phân loại ban đầu hoặc kiểm tra trình độ để xem dữ liệu FAME-KT.</Text>
            </View>
          ) : (
            assessmentHistory.map((item, idx) => (
              <View key={item.id || idx} style={styles.historyCard}>
                <View style={[styles.iconBox, { backgroundColor: item.isCorrect ? '#dcfce7' : '#fee2e2' }]}>
                  <Ionicons 
                    name={item.isCorrect ? "checkmark" : "close"} 
                    size={20} 
                    color={item.isCorrect ? "#16a34a" : "#ef4444"} 
                  />
                </View>
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.question?.quesionText || "Câu hỏi đánh giá trình độ"}
                  </Text>
                  <View style={styles.metaRow}>
                    {item.question?.skillCategory && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.question.skillCategory}</Text>
                      </View>
                    )}
                    <Text style={styles.time}>
                      {(item.timeTakenMs / 1000).toFixed(1)}s • {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.eloBox}>
                  <Text style={styles.eloLabel}>Elo sau test</Text>
                  <Text style={styles.eloValue}>{item.avgEloAfter || 1200}</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },

  content: { padding: 16, paddingBottom: 40 },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, lineHeight: 20 },

  /* Test Card Styles */
  testCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  lessonName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
    borderTopColor: '#f1f5f9',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  passedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
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
    backgroundColor: '#ffffff', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  time: { fontSize: 11, color: '#94a3b8' },
  eloBox: { alignItems: 'flex-end', marginLeft: 8 },
  eloLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
  eloValue: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' }
});
