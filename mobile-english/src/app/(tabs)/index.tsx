import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../../api/axiosClient';

export default function HomeScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Lấy thông tin user cơ bản từ SecureStore (được lưu lúc Đăng nhập)
        const storedUser = await SecureStore.getItemAsync('userInfo');
        if (storedUser) {
          setUserInfo(JSON.parse(storedUser));
        }

        // Hiện tại BE chưa có API lấy Dashboard cho Mobile User
        // TODO: Gọi API GET /api/mobile/dashboard khi BE hoàn thiện
        // const response = await axiosClient.get('/api/mobile/dashboard');

      } catch (error) {
        console.log("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const username = userInfo?.username || "Học viên";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={require('../../../assets/images/gacon.gif')} style={styles.avatar} />
            <View>
              <Text style={styles.greeting}>Xin chào, {username}!</Text>
              <View style={[styles.streakBadge, {backgroundColor: '#e5e7eb'}]}>
                <Text style={[styles.streakText, {color: '#6b7280'}]}>Chuỗi ngày: Đang cập nhật...</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* CẤP ĐỘ HIỆN TẠI (LEVEL CARD) */}
        <LinearGradient colors={['#4f46e5', '#3b82f6']} style={styles.levelCard} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <Text style={styles.levelLabel}>CẤP ĐỘ HIỆN TẠI</Text>
          <Text style={styles.levelTitle}>Đang cập nhật...</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Tiến trình chung</Text>
            <Text style={styles.progressPercent}>0%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%', backgroundColor: '#ffffff' }]} />
          </View>
        </LinearGradient>

        {/* CHỦ ĐỀ HỌC TẬP */}
        <Text style={styles.sectionTitle}>Chủ đề học tập</Text>
        <View style={styles.topicCard}>
          <View style={styles.topicHeader}>
            <View style={styles.topicIconContainer}>
              <Ionicons name="time-outline" size={24} color="#9ca3af" />
            </View>
            <View style={styles.topicInfo}>
              <Text style={styles.topicTitle}>Dữ liệu đang cập nhật...</Text>
              <Text style={styles.topicSubtitle}>Hệ thống Backend chưa cung cấp API Topic cho User</Text>
            </View>
          </View>
        </View>

        {/* BÀI HỌC */}
        <Text style={styles.sectionTitle}>Bài học</Text>
        <View style={styles.lessonCard}>
          <View style={styles.lessonHeader}>
            <View>
              <Text style={styles.lessonTitle}>Dữ liệu đang cập nhật...</Text>
              <Text style={styles.lessonSubtitle}>Hệ thống Backend chưa cung cấp API Bài học cho User</Text>
            </View>
            <View style={styles.badgeLocked}>
              <View style={styles.lockedDot} />
              <Text style={styles.badgeTextLocked}>Chưa khả dụng</Text>
            </View>
          </View>
          <View style={styles.skillIcons}>
            <View style={styles.skillIconLocked}><Ionicons name="headset" size={16} color="#9ca3af" /></View>
            <View style={styles.skillIconLocked}><Ionicons name="mic" size={16} color="#9ca3af" /></View>
            <View style={styles.skillIconLocked}><Ionicons name="book" size={16} color="#9ca3af" /></View>
            <View style={styles.skillIconLocked}><Ionicons name="pencil" size={16} color="#9ca3af" /></View>
          </View>
        </View>

        {/* BOTTOM BANNER (DAILY CHALLENGE) */}
        <LinearGradient colors={['#ef4444', '#f43f5e']} style={styles.challengeBanner} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <View style={styles.challengeIconContainer}>
            <Ionicons name="ribbon-outline" size={28} color="#ffffff" />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeLabel}>THỬ THÁCH HÔM NAY</Text>
            <Text style={styles.challengeTitle}>Đang cập nhật hệ thống nhiệm vụ hàng ngày...</Text>
          </View>
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f3f4f6', marginRight: 12 },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  streakBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' },
  streakText: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
  notificationBtn: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  
  levelCard: { padding: 20, borderRadius: 16, marginBottom: 25, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  levelLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  levelTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 25 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressPercent: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 15, marginTop: 5 },
  
  topicCard: { flexDirection: 'column', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 15, backgroundColor: '#ffffff' },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  topicSubtitle: { fontSize: 13, color: '#6b7280' },

  lessonCard: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 15, backgroundColor: '#ffffff' },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  lessonTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  lessonSubtitle: { fontSize: 12, color: '#6b7280', maxWidth: '70%' },
  badgeLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  lockedDot: { width: 6, height: 6, backgroundColor: '#9ca3af', borderRadius: 3, marginRight: 4 },
  badgeTextLocked: { color: '#6b7280', fontSize: 11, fontWeight: 'bold' },

  skillIcons: { flexDirection: 'row', gap: 10 },
  skillIconLocked: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },

  challengeBanner: { flexDirection: 'row', padding: 20, borderRadius: 16, marginTop: 10, alignItems: 'center' },
  challengeIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  challengeInfo: { flex: 1 },
  challengeLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  challengeTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', lineHeight: 22 }
});