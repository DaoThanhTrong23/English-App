import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const storedUser = await SecureStore.getItemAsync('userInfo');
          if (storedUser) {
            setUserInfo(JSON.parse(storedUser));
          }
          const storedAvatar = await SecureStore.getItemAsync('userAvatar');
          if (storedAvatar) {
            setAvatarUri(storedAvatar);
          }
        } catch (error) {
          console.log("Error fetching profile data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }, [])
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userInfo');
    await SecureStore.deleteItemAsync('userAvatar');
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const username = userInfo?.username || "Đang cập nhật";
  const email = userInfo?.email || "Đang cập nhật";
  const xpPoints = userInfo?.xpPoints || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <TouchableOpacity onPress={() => { /* @ts-ignore */ router.push('/settings')}}>
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image 
            source={{ uri: avatarUri || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => { /* @ts-ignore */ router.push('/edit-profile')}}>
            <Text style={styles.editBtnText}>Cập nhật thông tin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Ngày liên tiếp</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{xpPoints}</Text>
            <Text style={styles.statLabel}>Tổng XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Cấp độ</Text>
          </View>
        </View>

        <View style={{marginHorizontal: 20, marginBottom: 15}}>
          <Text style={{fontSize: 12, color: '#ef4444', fontStyle: 'italic', textAlign: 'center'}}>
            *Một số thông số (Ngày liên tiếp, Cấp độ) đang chờ API từ Backend*
          </Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}><Ionicons name="time-outline" size={20} color="#3b82f6" /></View>
            <Text style={styles.menuText}>Lịch sử học tập</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}><Ionicons name="medal-outline" size={20} color="#f59e0b" /></View>
            <Text style={styles.menuText}>Thành tích & Huy hiệu</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}><Ionicons name="shield-checkmark-outline" size={20} color="#10b981" /></View>
            <Text style={styles.menuText}>Quyền riêng tư</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{marginRight: 8}}/>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  profileSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffffff', marginBottom: 15, borderWidth: 2, borderColor: '#e5e7eb' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  editBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 20, borderRadius: 16, paddingVertical: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 10 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', height: '80%', alignSelf: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  menuContainer: { backgroundColor: '#ffffff', marginHorizontal: 20, borderRadius: 16, padding: 10, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginHorizontal: 20, backgroundColor: '#fee2e2', borderRadius: 12, marginBottom: 30 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
