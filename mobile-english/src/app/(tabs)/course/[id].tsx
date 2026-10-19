import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { axiosClient } from '../../../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../../../context/ThemeContext';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [xpPoints, setXpPoints] = useState(0);

  useEffect(() => {
    fetchCourseDetail();
    fetchUserXP();
  }, [id]);

  const fetchUserXP = async () => {
    try {
      const userInfoStr = await SecureStore.getItemAsync('userInfo');
      if (userInfoStr) {
        const user = JSON.parse(userInfoStr);
        setXpPoints(user.xpPoints || 0);
      }
      const res = await axiosClient.get('/profile/me');
      if (res.data?.success && res.data.data) {
        setXpPoints(res.data.data.xpPoints || 0);
        await SecureStore.setItemAsync('userInfo', JSON.stringify(res.data.data));
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/student/courses/${id}`);
      if (res.data?.success) {
        setCourseData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching course detail:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !courseData) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Calculate total words in the course
  const totalWordsInCourse = courseData.lessons.reduce((acc: number, cur: any) => acc + (cur.totalWords || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {courseData.title}
        </Text>
        <View style={[styles.xpBadge, isDark && { backgroundColor: '#27272a', borderColor: '#3f3f46' }]}>
          <Image source={require('../../../../assets/images/gacon.gif')} style={{width: 16, height: 16, marginRight: 4}} />
          <Ionicons name="server" size={14} color={isDark ? '#facc15' : '#d97706'} style={{marginRight: 4}} />
          <Text style={[styles.xpText, isDark && { color: '#fbbf24' }]}>{xpPoints}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>👋 CHỦ ĐỀ ({courseData.cefrLevel})</Text>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>{courseData.title}</Text>
              <Text style={styles.heroSubtitle}>
                {courseData.totalLessons} bài học - {totalWordsInCourse} từ vựng
              </Text>
            </View>
            <View style={styles.heroRight}>
              {/* Tiến độ phần trăm chủ đề */}
              <View style={styles.circleProgress}>
                <Text style={styles.circleText}>{courseData.progressPercentage}%</Text>
                <Text style={styles.circleSub}>XONG</Text>
              </View>
            </View>
          </View>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.text }]}>Tiến độ chủ đề</Text>
            <Text style={[styles.progressCount, { color: theme.primary }]}>{courseData.completedLessons}/{courseData.totalLessons} Bài học</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.cardSecondary }]}>
            <View style={[styles.progressBarFill, { width: `${courseData.progressPercentage}%` }]} />
          </View>
        </View>

        {/* DANH SÁCH BÀI HỌC */}
        <Text style={[styles.listTitle, { color: theme.text }]}>Danh sách bài học</Text>
        <View style={styles.lessonsContainer}>
          {courseData.lessons.map((lesson: any, index: number) => {
            // Xác định trạng thái của bài học (dựa vào UI Design)
            const isCompleted = lesson.isCompleted;
            const isFirstIncomplete = !isCompleted && courseData.lessons.findIndex((l:any) => !l.isCompleted) === index;
            const isLocked = !isCompleted && !isFirstIncomplete;

            let badgeText = "Chưa học";
            let badgeBg = isDark ? '#27272a' : "#f3f4f6";
            let badgeColor = isDark ? '#a1a1aa' : "#6b7280";
            let barColor = isDark ? '#27272a' : "#e5e7eb";
            let barWidth = "0%";
            let circleBg = isDark ? '#27272a' : "#f3f4f6";
            let circleColor = isDark ? '#71717a' : "#9ca3af";
            let cardBorder = "transparent";

            const totalTests = lesson.totalTests || 5;
            const completedTests = lesson.completedTests || 0;
            const progressPercent = totalTests > 0 
              ? Math.min(100, Math.round((completedTests / totalTests) * 100))
              : (isCompleted ? 100 : 0);

            if (isCompleted) {
              badgeText = "Hoàn thành";
              badgeBg = isDark ? '#064e3b' : "#d1fae5";
              badgeColor = isDark ? '#34d399' : "#059669";
              barColor = "#10b981";
              barWidth = "100%";
              circleBg = isDark ? '#1e3a8a' : "#dbeafe";
              circleColor = isDark ? '#60a5fa' : "#3b82f6";
            } else if (isFirstIncomplete) {
              badgeText = "Đang học";
              badgeBg = isDark ? '#1e3a8a' : "#dbeafe";
              badgeColor = isDark ? '#60a5fa' : "#2563eb";
              barColor = "#3b82f6";
              barWidth = `${Math.max(15, progressPercent)}%`;
              circleBg = isDark ? '#1e3a8a' : "#dbeafe";
              circleColor = isDark ? '#60a5fa' : "#3b82f6";
              cardBorder = "#3b82f6";
            }

            return (
              <TouchableOpacity 
                key={lesson.id} 
                style={[
                  styles.lessonCard, 
                  { 
                    backgroundColor: theme.card,
                    borderWidth: 1, 
                    borderColor: cardBorder !== 'transparent' ? cardBorder : theme.border 
                  }
                ]}
                disabled={isLocked}
                onPress={() => router.push(`/lesson/${lesson.id}`)}
              >
                <View style={styles.lessonRow}>
                  <View style={[styles.lessonCircle, { backgroundColor: circleBg }]}>
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={16} color={isDark ? '#71717a' : '#9ca3af'} />
                    ) : (
                      <Text style={[styles.lessonCircleText, { color: circleColor }]}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, { color: isLocked ? theme.subtext : theme.text }]}>Bài {index + 1}: {lesson.title}</Text>
                    <Text style={[styles.lessonSubtitle, { color: theme.subtext }]}>{totalTests} kỹ năng - {lesson.totalWords || 0} từ vựng</Text>
                  </View>

                  <View style={[styles.lessonBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.lessonBadgeText, { color: badgeColor }]}>{badgeText}</Text>
                  </View>
                </View>
                
                {/* Thanh tiến độ bài học */}
                <View style={[styles.lessonBarBg, { marginTop: 15, backgroundColor: isDark ? '#27272a' : '#f3f4f6' }]}>
                  <View style={[styles.lessonBarFill, { backgroundColor: barColor, width: barWidth as any }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#fde68a' },
  xpText: { color: '#d97706', fontWeight: 'bold', fontSize: 13 },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  heroCard: { backgroundColor: '#4f46e5', borderRadius: 16, padding: 20, marginBottom: 20 },
  heroTop: { marginBottom: 15 },
  heroTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroTagText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLeft: { flex: 1, paddingRight: 15 },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  heroRight: { width: 70, height: 70 },
  circleProgress: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  circleText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  circleSub: { color: '#ffffff', fontSize: 9, fontWeight: 'bold', marginTop: -2 },

  progressSection: { marginBottom: 25 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, color: '#4b5563', fontWeight: 'bold' },
  progressCount: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },

  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  lessonsContainer: { gap: 12 },
  
  lessonCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3 },
  lessonRow: { flexDirection: 'row', alignItems: 'center' },
  lessonCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  lessonCircleText: { fontSize: 16, fontWeight: 'bold' },
  lessonInfo: { flex: 1, paddingRight: 10 },
  lessonTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  lessonSubtitle: { fontSize: 12, color: '#6b7280' },
  lessonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  lessonBadgeText: { fontSize: 11, fontWeight: 'bold' },
  
  lessonBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  lessonBarFill: { height: '100%', borderRadius: 3 }
});
