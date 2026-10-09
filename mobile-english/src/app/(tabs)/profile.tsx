import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { axiosClient } from '../../api/axiosClient';
import { Alert } from 'react-native';

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
          if (storedUser) setUserInfo(JSON.parse(storedUser));
          const storedAvatar = await SecureStore.getItemAsync('userAvatar');
          if (storedAvatar) setAvatarUri(storedAvatar);
        } catch (error) {
          console.log("Error fetching profile data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }, [])
  );

  
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Show loading indicator instead of avatar
        setLoading(true);
        
        const localUri = selectedAsset.uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        const formData = new FormData();
        // @ts-ignore
        formData.append('avatar', { uri: localUri, name: filename, type });

        try {
          const res = await axiosClient.put('/profile/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data?.success) {
            const newAvatarUrl = 'http://localhost:3000' + res.data.data.avatarUrl; // Or API_URL base
            setAvatarUri(newAvatarUrl);
            await SecureStore.setItemAsync('userAvatar', newAvatarUrl);
            Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
          }
        } catch (apiErr: any) {
          console.error(apiErr);
          Alert.alert('Lỗi', 'Không thể tải ảnh lên máy chủ.');
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  
  const handleDeleteAccount = () => {
    Alert.alert(
      "Cảnh báo nguy hiểm",
      "Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản và toàn bộ tiến trình học tập không? Thao tác này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa tài khoản", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await axiosClient.delete('/profile/delete-account');
              if (res.data?.success) {
                Alert.alert("Thành công", "Tài khoản của bạn đã được xóa.");
                handleLogout(); // Clear local storage and navigate to login
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể xóa tài khoản lúc này.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const username = userInfo?.username || "Đang cập nhật";
  const email = userInfo?.email || "Chưa có email";
  const xpPoints = userInfo?.xpPoints || 0;
  const cefrLevel = userInfo?.cefrLevel || "Chưa làm bài test";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
          <TouchableOpacity onPress={() => { /* @ts-ignore */ router.push('/settings')}}>
            <Ionicons name="settings-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/gacon.gif')} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => { /* @ts-ignore */ router.push('/edit-profile')}}>
            <Text style={styles.editBtnText}>Cập nhật thông tin</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTICS */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="star" size={20} color="#d97706" />
            </View>
            <View>
              <Text style={styles.statLabel}>Kinh nghiệm</Text>
              <Text style={styles.statNumber}>{xpPoints} XP</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="ribbon" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Trình độ CEFR</Text>
              <Text style={styles.statNumber}>{cefrLevel}</Text>
            </View>
          </View>
        </View>

        {/* MENU OPTIONS */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Chung</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push('/saved-words')}}><View style={[styles.menuIcon, { backgroundColor: '#f3f4f6' }]}><Ionicons name="bookmark-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Từ vựng đã lưu</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push('/history')}}><View style={[styles.menuIcon, { backgroundColor: '#f3f4f6' }]}><Ionicons name="time-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Lịch sử học tập</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => { /* @ts-ignore */ router.push('/achievements')}}><View style={[styles.menuIcon, { backgroundColor: '#f3f4f6' }]}><Ionicons name="trophy-outline" size={20} color="#374151" /></View><Text style={styles.menuText}>Thành tựu</Text><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Tài khoản</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Đăng xuất</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Xóa tài khoản</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  profileSection: { alignItems: 'center', backgroundColor: '#ffffff', paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f3f4f6', borderWidth: 3, borderColor: '#ffffff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 15 },
  editBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },

  statsContainer: { flexDirection: 'row', padding: 20, gap: 15 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  statIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  statNumber: { fontSize: 15, fontWeight: 'bold', color: '#111827' },

  menuContainer: { backgroundColor: '#ffffff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  badgeUpdate: { fontSize: 11, color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 10, overflow: 'hidden' },
});
