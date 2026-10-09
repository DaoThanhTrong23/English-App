import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';

export default function HomeScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetLevel, setTargetLevel] = useState<string>('Đang cập nhật...');
  const [courses, setCourses] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      const fetchAvatar = async () => {
        try {
          const storedAvatar = await SecureStore.getItemAsync('userAvatar');
          if (storedAvatar) setAvatarUri(storedAvatar);
        } catch (error) {
          console.log("Error fetching avatar data:", error);
        }
      };
      fetchAvatar();
      loadHomeData();
    }, [])
  );

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const info = await SecureStore.getItemAsync('userInfo');
      if (info) setUserInfo(JSON.parse(info));

      const avatar = await SecureStore.getItemAsync('userAvatar');
      if (avatar) setAvatarUri(avatar);

      const levelGroup = await SecureStore.getItemAsync('targetLevelGroup');
      if (levelGroup) setTargetLevel(levelGroup);

      const res = await axiosClient.get('/student/courses', {
        params: { targetLevelGroup: levelGroup }
      });

      if (res.data?.success) {
        const fetchedCourses = res.data.data.items || [];
        setCourses(fetchedCourses);

        if (res.data.data.streak !== undefined) {
          setStreak(res.data.data.streak);
        }

        if (fetchedCourses.length > 0) {
          const firstCourse = fetchedCourses[0];
          
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const username = userInfo?.username || "Học viên";
  const overallProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / courses.length) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/gacon.gif')} style={styles.avatar} />
            <View>
              <Text style={styles.greeting}>Xin chào, {username}!</Text>
              <View style={[styles.streakBadge, { backgroundColor: '#fff7ed' }]}>
                <Text style={[styles.streakText, { color: '#ea580c' }]}>
                  🔥 {streak > 0 ? `${streak} ngày liên tiếp` : '0 ngày liên tiếp'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* CẤP ĐỘ HIỆN TẠI (LEVEL CARD) */}
        <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.levelCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.levelLabel}>CẤP ĐỘ HIỆN TẠI</Text>
          <Text style={styles.levelTitle}>{targetLevel}</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Tiến trình chung</Text>
            <Text style={styles.progressPercent}>{overallProgress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${overallProgress}%`, backgroundColor: '#ffffff' }]} />
          </View>
        </LinearGradient>

        
        {/* GAME HUB & NHIỆM VỤ */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <TouchableOpacity 
            style={{flex: 1, backgroundColor: '#fef3c7', padding: 15, borderRadius: 16, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a'}}
            onPress={() => { /* @ts-ignore */ router.push('/games')}}
          >
            <Ionicons name="game-controller" size={32} color="#d97706" />
            <Text style={{fontWeight: 'bold', color: '#b45309', marginTop: 8}}>Giải Trí</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{flex: 1, backgroundColor: '#dcfce7', padding: 15, borderRadius: 16, marginLeft: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0'}}
            onPress={() => alert('Đã nhận nhiệm vụ: Hoàn thành 1 bài học (+20 XP)')}
          >
            <Ionicons name="calendar" size={32} color="#15803d" />
            <Text style={{fontWeight: 'bold', color: '#166534', marginTop: 8}}>Nhiệm Vụ</Text>
          </TouchableOpacity>
        </View>

        {/* CHỦ ĐỀ HỌC TẬP */}

        <Text style={styles.sectionTitle}>Chủ đề học tập</Text>
        <View style={styles.topicsContainer}>
          {courses.map((course: any) => {
             
             const pct = course.progressPercentage || 0;
             return (
              <TouchableOpacity 
                key={course.id} 
                style={styles.topicCard} 
                onPress={() => {
                  router.push({ pathname: '/(tabs)/course/[id]', params: { id: course.id } } as any);
                }}>
                <View style={styles.topicHeader}>
                  <View style={[styles.topicIconContainer, { padding: 0, overflow: 'hidden' }]}>
                    <Image source={course.imageUrl ? { uri: course.imageUrl } : require('../../../assets/images/gacon.gif')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                  <View style={styles.topicInfo}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.topicTitle]}>{course.title}</Text>
                      <Text style={[styles.topicPercent, {color: pct > 0 ? '#10b981' : '#6b7280'}]}>{pct}%</Text>
                    </View>
                    <Text style={styles.topicSubtitle}>{course.totalLessons} bài học</Text>
                    <View style={styles.topicProgressBarBg}>
                      <View style={[styles.topicProgressBarFill, { width: `${pct}%`, backgroundColor: pct > 0 ? '#3b82f6' : '#e5e7eb' }]} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
             );
          })}
        </View>

        {/* BOTTOM BANNER */}
        <LinearGradient colors={['#ef4444', '#f43f5e']} style={styles.challengeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.challengeIconContainer}>
            <Ionicons name="ribbon-outline" size={28} color="#ffffff" />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeLabel}>THỬ THÁCH HÔM NAY</Text>
            <Text style={styles.challengeTitle}>Hoàn thành 1000 bài luyện nói phát âm trôi chảy</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#e5e7eb', marginRight: 12 },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  streakBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  streakText: { fontSize: 11, fontWeight: 'bold' },
  notificationBtn: { padding: 8, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },

  levelCard: { padding: 20, borderRadius: 16, marginBottom: 25, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  levelLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  levelTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 25 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressPercent: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 15, marginTop: 5 },

  topicsContainer: { marginBottom: 10 },
  topicCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12, backgroundColor: '#ffffff' },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIconContainer: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  topicPercent: { fontSize: 14, fontWeight: 'bold' },
  topicSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  topicProgressBarBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, overflow: 'hidden' },
  topicProgressBarFill: { height: '100%', borderRadius: 2 },

  lessonsContainer: { marginBottom: 10 },
  lessonCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 12, backgroundColor: '#ffffff' },
  lessonHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  lessonTitleText: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  lessonSubtitleText: { fontSize: 12, color: '#6b7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  lessonSkillsRow: { flexDirection: 'row', gap: 10 },
  skillIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  challengeBanner: { flexDirection: 'row', padding: 20, borderRadius: 16, marginTop: 10, alignItems: 'center' },
  challengeIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  challengeInfo: { flex: 1 },
  challengeLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  challengeTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', lineHeight: 22 }
});