import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../../api/axiosClient';
import { useAppTheme } from '../../../context/ThemeContext';

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { fetchLessonDetail(); }, [id]));

  const fetchLessonDetail = async () => {
    try {
      const res = await axiosClient.get(`/student/lessons/${id}`);
      if (res.data?.success) {
        setLesson(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text }}>Không tìm thấy bài học</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getSkillScore = (skillType: string) => {
    if (!lesson || !lesson.tests) return { score: 0, max: 0, pct: 0 };
    
    const keywordMap: Record<string, string[]> = {
      'listening': ['nghe', 'listening'],
      'reading': ['đọc', 'reading'],
      'writing': ['viết', 'writing'],
      'speaking': ['nói', 'speaking'],
      'test': ['kiểm tra', 'test', 'tổng hợp']
    };
    const keywords = keywordMap[skillType] || [skillType];
    
    const test = lesson.tests.find((t: any) => {
      if (!t.title) return false;
      const titleLower = t.title.toLowerCase();
      return keywords.some(k => titleLower.includes(k));
    });

    if (test) {
      const totalPossible = (test.totalQuestions || 0) * 10;
      const score = test.userResult?.bestScore || 0;
      const pct = totalPossible === 0 ? 0 : Math.min(100, Math.round((score / totalPossible) * 100));
      return { score, max: totalPossible, pct };
    }
    return { score: 0, max: 0, pct: 0 };
  };

  const completedSkills = ['listening', 'reading', 'writing', 'speaking', 'test']
    .filter(type => getSkillScore(type).score > 0).length;

  // Tính toán tiến độ thực tế chính xác dựa trên kỹ năng hoàn thành và từ vựng đã học
  const isCompleted = lesson.summary?.isCompleted;
  const totalWords = lesson.summary?.totalWords || (lesson.words?.length || 0);
  const wordsLearned = lesson.summary?.wordsLearned || 0;

  let progressPct = 0;
  if (isCompleted) {
    progressPct = 100;
  } else {
    const skillRatio = completedSkills / 5;
    const wordRatio = totalWords > 0 ? wordsLearned / totalWords : skillRatio;
    progressPct = Math.min(100, Math.round((skillRatio * 0.6 + wordRatio * 0.4) * 100));
  }

  const words = lesson.words || [];
  const maxWordsToShow = 5;

  const navigateToPractice = (skillType: string) => {
    router.push({ pathname: '/practice', params: { lessonId: id, type: skillType } } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER BAR */}
      <View style={[styles.headerBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{lesson.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* MASCOT GREETING */}
        <View style={[styles.greetingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.greetingHeader}>
            <Image source={require('../../../../assets/images/gacon.gif')} style={styles.mascotImg} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.greetingTitle, { color: theme.text }]}>Chào mừng đến với bài học mới!</Text>
              <Text style={[styles.greetingText, { color: theme.subtext }]}>Hãy bắt đầu với 5 kỹ năng để nắm chắc từ vựng và phát âm.</Text>
            </View>
          </View>
          <View style={[styles.chatBubble, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={isDark ? '#60a5fa' : '#3b82f6'} />
            <Text style={[styles.chatText, { color: isDark ? '#93c5fd' : '#2563eb' }]}>Hello! Let's start.</Text>
          </View>
        </View>

        {/* PROGRESS */}
        <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>Tiến độ</Text>
            <Text style={[styles.progressValue, { color: theme.primary }]}>{completedSkills}/5 kỹ năng hoàn thành</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.cardSecondary }]}>
            <View style={[styles.progressBarFill, { width: `${(completedSkills/5)*100}%` }]} />
          </View>
        </View>

        {/* SKILLS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>5 kỹ năng</Text>
        <View style={[styles.skillsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.skillCard, { borderBottomColor: theme.border }]} onPress={() => navigateToPractice('listening')}>
            <View style={[styles.skillIconBox, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
              <Ionicons name="headset" size={20} color={isDark ? '#e4e4e7' : '#374151'} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, { color: theme.text }]}>Nghe (Listening)</Text>
              <Text style={[styles.skillDesc, { color: theme.subtext }]}>Luyện nghe phát âm chuẩn</Text>
            </View>
            <Text style={[styles.skillPercent, { color: theme.primary }]}>{getSkillScore('listening').score}/{getSkillScore('listening').max} XP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.skillCard, { borderBottomColor: theme.border }]} onPress={() => navigateToPractice('reading')}>
            <View style={[styles.skillIconBox, { backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
              <Ionicons name="book" size={20} color={isDark ? '#e4e4e7' : '#6b7280'} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, { color: theme.text }]}>Đọc (Reading)</Text>
              <Text style={[styles.skillDesc, { color: theme.subtext }]}>Nhận biết từ vựng và câu</Text>
            </View>
            <Text style={[styles.skillPercent, { color: theme.primary }]}>{getSkillScore('reading').score}/{getSkillScore('reading').max} XP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.skillCard, { borderBottomColor: theme.border }]} onPress={() => navigateToPractice('writing')}>
            <View style={[styles.skillIconBox, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
              <Ionicons name="pencil" size={20} color={isDark ? '#fbbf24' : '#d97706'} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, { color: theme.text }]}>Viết (Writing)</Text>
              <Text style={[styles.skillDesc, { color: theme.subtext }]}>Viết lại từ vựng đúng chính tả</Text>
            </View>
            <Text style={[styles.skillPercent, { color: theme.primary }]}>{getSkillScore('writing').score}/{getSkillScore('writing').max} XP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.skillCard, { borderBottomColor: theme.border }]} onPress={() => navigateToPractice('speaking')}>
            <View style={[styles.skillIconBox, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
              <Ionicons name="mic" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, { color: theme.text }]}>Nói (Speaking)</Text>
              <Text style={[styles.skillDesc, { color: theme.subtext }]}>Luyện phát âm và ngữ điệu</Text>
            </View>
            <Text style={[styles.skillPercent, { color: theme.primary }]}>{getSkillScore('speaking').score}/{getSkillScore('speaking').max} XP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.skillCard, { borderBottomWidth: 0 }]} onPress={() => navigateToPractice('test')}>
            <View style={[styles.skillIconBox, { backgroundColor: isDark ? '#450a0a' : '#fee2e2' }]}>
              <Ionicons name="checkbox" size={20} color={isDark ? '#f87171' : '#ef4444'} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillTitle, { color: theme.text }]}>Kiểm tra (Test)</Text>
              <Text style={[styles.skillDesc, { color: theme.subtext }]}>Đánh giá năng lực tổng hợp</Text>
            </View>
            <Text style={[styles.skillPercent, { color: theme.primary }]}>{getSkillScore('test').score}/{getSkillScore('test').max} XP</Text>
          </TouchableOpacity>
        </View>

        {/* VOCABULARY */}
        <View style={[styles.vocabCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.vocabHeader}>
            <Text style={[styles.vocabTitle, { color: theme.text }]}>Từ vựng trong bài</Text>
            <Text style={[styles.vocabCount, { color: theme.primary }]}>{words.length} từ</Text>
          </View>
          {words.slice(0, maxWordsToShow).map((w: any, index: number) => (
            <View key={w.id} style={styles.vocabRow}>
              <View style={styles.vocabDot} />
              <Text style={[styles.vocabEng, { color: theme.text }]} numberOfLines={1}>{w.headword}</Text>
              <Text style={[styles.vocabSlash, { color: theme.subtext }]}>/</Text>
              <Text style={[styles.vocabVie, { color: theme.subtext }]} numberOfLines={1}>{w.meaning}</Text>
              <View style={styles.vocabLearnedDot} />
            </View>
          ))}
          {words.length > maxWordsToShow && (
            <Text style={[styles.vocabMore, { color: theme.subtext }]}>+ {words.length - maxWordsToShow} từ nữa...</Text>
          )}
          {words.length === 0 && (
             <Text style={[styles.vocabDesc, { color: theme.subtext }]}>Chưa có từ vựng nào được thêm.</Text>
          )}
        </View>

        {/* FOOTER BUTTON */}
        <TouchableOpacity style={styles.startBtn} onPress={() => navigateToPractice('listening')}>
          <Text style={styles.startBtnText}>Bắt đầu học</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  greetingCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#ffffff', marginBottom: 15 },
  greetingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  mascotImg: { width: 50, height: 50, marginRight: 15 },
  greetingTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  greetingText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  chatBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 10, borderRadius: 8 },
  chatText: { marginLeft: 8, color: '#2563eb', fontWeight: 'bold', fontSize: 13 },

  progressCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#ffffff', marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  progressValue: { fontSize: 13, fontWeight: 'bold', color: '#3b82f6' },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  
  skillsContainer: { borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#ffffff', marginBottom: 20, overflow: 'hidden' },
  skillCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  skillIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  skillInfo: { flex: 1 },
  skillTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  skillDesc: { fontSize: 12, color: '#6b7280' },
  skillPercent: { fontSize: 14, fontWeight: 'bold' },

  vocabCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#ffffff', marginBottom: 20 },
  vocabHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  vocabTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  vocabCount: { fontSize: 13, fontWeight: 'bold', color: '#3b82f6' },
  vocabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  vocabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6', marginRight: 10 },
  vocabEng: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#111827' },
  vocabSlash: { marginHorizontal: 10, color: '#9ca3af' },
  vocabVie: { flex: 1, fontSize: 14, color: '#374151', textAlign: 'right' },
  vocabLearnedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginLeft: 10 },
  vocabMore: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 10 },
  vocabDesc: { textAlign: 'center', color: '#6b7280', fontSize: 13 },

  startBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  startBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
