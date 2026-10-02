import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { axiosClient } from '../../../api/axiosClient';
import * as SecureStore from 'expo-secure-store';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
        setXpPoints(user.xpPoints || 120);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Calculate total words in the course
  const totalWordsInCourse = courseData.lessons.reduce((acc: number, cur: any) => acc + (cur.totalWords || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseData.title}
        </Text>
        <View style={styles.xpBadge}>
          <Image source={require('../../../../assets/images/gacon.gif')} style={{width: 16, height: 16, marginRight: 4}} />
          <Ionicons name="server" size={14} color="#d97706" style={{marginRight: 4}} />
          <Text style={styles.xpText}>{xpPoints}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO CARD */}
        <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
              {/* Fake Circular Progress */}
              <View style={styles.circleProgress}>
                <Text style={styles.circleText}>{courseData.progressPercentage}%</Text>
                <Text style={styles.circleSub}>XONG</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* PROGRESS BAR */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tiến độ chủ đề</Text>
            <Text style={styles.progressCount}>{courseData.completedLessons}/{courseData.totalLessons} Bài học</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${courseData.progressPercentage}%` }]} />
          </View>
        </View>

        {/* DANH SÁCH BÀI HỌC */}
        <Text style={styles.listTitle}>Danh sách bài học</Text>
        <View style={styles.lessonsContainer}>
          {courseData.lessons.map((lesson: any, index: number) => {
            // Xác định trạng thái của bài học (dựa vào UI Design)
            const isCompleted = lesson.isCompleted;
            const isFirstIncomplete = !isCompleted && courseData.lessons.findIndex((l:any) => !l.isCompleted) === index;
            const isLocked = !isCompleted && !isFirstIncomplete;

            let badgeText = "Chưa học";
            let badgeBg = "#f3f4f6";
            let badgeColor = "#6b7280";
            let barColor = "#e5e7eb";
            let barWidth = "0%";
            let circleBg = "#f3f4f6";
            let circleColor = "#9ca3af";
            let cardBorder = "transparent";

            if (isCompleted) {
              badgeText = "Hoàn thành";
              badgeBg = "#d1fae5";
              badgeColor = "#059669";
              barColor = "#10b981";
              barWidth = "100%";
              circleBg = "#dbeafe";
              circleColor = "#3b82f6";
            } else if (isFirstIncomplete) {
              badgeText = "Đang học";
              badgeBg = "#dbeafe";
              badgeColor = "#2563eb";
              barColor = "#3b82f6";
              barWidth = "30%";
              circleBg = "#dbeafe";
              circleColor = "#3b82f6";
              cardBorder = "#3b82f6";
            }

            return (
              <TouchableOpacity 
                key={lesson.id} 
                style={[styles.lessonCard, { borderColor: cardBorder, borderWidth: cardBorder !== 'transparent' ? 1 : 1, borderColor: cardBorder !== 'transparent' ? cardBorder : '#f3f4f6' }]}
                disabled={isLocked}
                onPress={() => router.push(`/lesson/${lesson.id}`)}
              >
                <View style={styles.lessonRow}>
                  <View style={[styles.lessonCircle, { backgroundColor: circleBg }]}>
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                    ) : (
                      <Text style={[styles.lessonCircleText, { color: circleColor }]}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, isLocked && {color: '#6b7280'}]}>Bài {index + 1}: {lesson.title}</Text>
                    <Text style={styles.lessonSubtitle}>4 kỹ năng - {lesson.totalWords || 0} từ vựng</Text>
                  </View>

                  <View style={[styles.lessonBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.lessonBadgeText, { color: badgeColor }]}>{badgeText}</Text>
                  </View>
                </View>
                
                {/* Thanh tiến độ bài học */}
                <View style={[styles.lessonBarBg, { marginTop: 15 }]}>
                  <View style={[styles.lessonBarFill, { backgroundColor: barColor, width: barWidth }]} />
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
  
  heroCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
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
