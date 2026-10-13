import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { axiosClient } from '../../api/axiosClient';
import { useAppTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password modal state
  const [changePassModalVisible, setChangePassModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPass, setSubmittingPass] = useState(false);

  // Lock account modal state
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [submittingLock, setSubmittingLock] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          // 1. Hiển thị ngay từ cache cục bộ để không bị lag
          const storedUser = await SecureStore.getItemAsync('userInfo');
          if (storedUser) setUserInfo(JSON.parse(storedUser));
          const storedAvatar = await SecureStore.getItemAsync('userAvatar');
          if (storedAvatar) setAvatarUri(storedAvatar);

          // 2. Luôn đồng bộ dữ liệu người dùng và avatar mới nhất từ server
          const res = await axiosClient.get('/profile/me');
          if (res.data?.success && res.data.data) {
            const user = res.data.data;
            setUserInfo(user);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

            if (user.avatarUrl) {
              const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
              const fullAvatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : baseURL + user.avatarUrl;
              setAvatarUri(fullAvatar);
              await SecureStore.setItemAsync('userAvatar', fullAvatar);
            }
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

  const uploadAvatar = async (localUri: string) => {
    setLoading(true);
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
        const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
        const newAvatarUrl = res.data.data.avatarUrl.startsWith('http') ? res.data.data.avatarUrl : baseURL + res.data.data.avatarUrl;
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
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Ứng dụng cần quyền camera để chụp ảnh!');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Ứng dụng cần quyền thư viện để chọn ảnh!');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Đổi ảnh đại diện',
      'Chọn phương thức cập nhật ảnh:',
      [
        { text: 'Chụp ảnh mới', onPress: () => pickImage(true) },
        { text: 'Chọn từ Thư viện', onPress: () => pickImage(false) },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường thông tin');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setSubmittingPass(true);
      const res = await axiosClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (res.data?.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới nhé.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePassModalVisible(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại, vui lòng kiểm tra lại mật khẩu cũ!';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmittingPass(false);
    }
  };

  const handleRetakePlacement = () => {
    Alert.alert(
      "Đánh giá lại trình độ",
      "Bạn có muốn làm lại bài kiểm tra thích ứng FAME-KT để hệ thống thiết lập lại lộ trình học phù hợp nhất không?",
      [
        { text: "Để sau", style: "cancel" },
        { 
          text: "Bắt đầu làm bài", 
          onPress: () => {
            /* @ts-ignore */
            router.push('/onboarding');
          } 
        }
      ]
    );
  };

  const openLockModal = () => {
    setLockPassword('');
    setLockModalVisible(true);
  };

  const handleConfirmLockAccount = async () => {
    if (!lockPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu để xác nhận khóa tài khoản!');
      return;
    }

    try {
      setSubmittingLock(true);
      const res = await axiosClient.post('/profile/lock-account', {
        password: lockPassword.trim()
      });

      if (res.data?.success) {
        setLockModalVisible(false);
        Alert.alert(
          'Khóa tài khoản thành công',
          res.data.message || 'Tài khoản của bạn đã được khóa thành công. Bạn cần liên hệ Quản trị viên để được mở khóa!',
          [
            {
              text: 'Đồng ý',
              onPress: async () => {
                await handleLogout();
              }
            }
          ]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể khóa tài khoản lúc này, vui lòng kiểm tra lại mật khẩu!';
      Alert.alert('Khóa tài khoản thất bại', msg);
    } finally {
      setSubmittingLock(false);
    }
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
  const cefrLevel = userInfo?.cefrLevel || "Chưa đánh giá";
  const streak = userInfo?.streak || 0;
  const masteredWords = userInfo?.masteredWordsCount || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Hồ sơ cá nhân</Text>
          <TouchableOpacity onPress={() => { /* @ts-ignore */ router.push('/settings')}}>
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* PROFILE INFO */}
        <View style={[styles.profileSection, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            <Image 
              source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/gacon.gif')} 
              style={[styles.avatar, { borderColor: theme.border }]} 
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={showImagePickerOptions}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{username}</Text>
          <Text style={[styles.email, { color: theme.subtext }]}>{email}</Text>
          <TouchableOpacity 
            style={[styles.editBtn, { backgroundColor: isDark ? '#27272a' : '#eff6ff' }]} 
            onPress={() => { /* @ts-ignore */ router.push('/edit-profile')}}
          >
            <Text style={[styles.editBtnText, { color: isDark ? '#ffffff' : '#3b82f6' }]}>Cập nhật thông tin</Text>
          </TouchableOpacity>
        </View>

        {/* 4-GRID STATISTICS DASHBOARD */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#27272a' : '#fef3c7' }]}>
              <Ionicons name="star" size={20} color={isDark ? '#facc15' : '#d97706'} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Kinh nghiệm</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>{xpPoints} XP</Text>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#27272a' : '#dbeafe' }]}>
              <Ionicons name="ribbon" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Trình độ CEFR</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>{cefrLevel}</Text>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#27272a' : '#ffedd5' }]}>
              <Ionicons name="flame" size={20} color={isDark ? '#fb923c' : '#ea580c'} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Chuỗi học tập</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>{streak} ngày</Text>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? '#27272a' : '#dcfce7' }]}>
              <Ionicons name="book" size={20} color={isDark ? '#4ade80' : '#16a34a'} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>Đã thuộc</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>{masteredWords} từ</Text>
            </View>
          </View>
        </View>

        {/* MENU OPTIONS */}
        <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Học tập & Tiến trình</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => { /* @ts-ignore */ router.push('/saved-words')}}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : '#eff6ff' }]}>
              <Ionicons name="bookmark-outline" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Từ vựng đã học (SRS)</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => { /* @ts-ignore */ router.push('/history')}}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : '#f0fdf4' }]}>
              <Ionicons name="time-outline" size={20} color={isDark ? '#4ade80' : '#16a34a'} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Lịch sử học tập & Điểm thi</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => { /* @ts-ignore */ router.push('/achievements')}}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : '#fefce8' }]}>
              <Ionicons name="trophy-outline" size={20} color={isDark ? '#facc15' : '#ca8a04'} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Bộ sưu tập thành tựu</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleRetakePlacement}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : '#faf5ff' }]}>
              <Ionicons name="analytics-outline" size={20} color={isDark ? '#c084fc' : '#9333ea'} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Đánh giá lại trình độ (FAME-KT)</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 20, color: theme.text }]}>Tài khoản & Hệ thống</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => setChangePassModalVisible(true)}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : theme.cardSecondary }]}>
              <Ionicons name="key-outline" size={20} color={theme.text} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => { /* @ts-ignore */ router.push('/settings')}}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : theme.cardSecondary }]}>
              <Ionicons name="notifications-outline" size={20} color={theme.text} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Cài đặt & Nhắc nhở học tập</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#27272a' : '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Đăng xuất</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={openLockModal}>
            <View style={[styles.menuIcon, { backgroundColor: isDark ? '#271b12' : '#fff7ed' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#ea580c" />
            </View>
            <Text style={[styles.menuText, { color: '#ea580c' }]}>Khóa tài khoản</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

        </View>

        {/* APP VERSION FOOTER */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subtext }]}>EngMaster • Phiên bản 1.0.0</Text>
        </View>

      </ScrollView>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal visible={changePassModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setChangePassModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Mật khẩu hiện tại</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.cardSecondary, color: theme.text }]}
                secureTextEntry
                placeholder="Nhập mật khẩu cũ"
                placeholderTextColor={theme.subtext}
                value={oldPassword}
                onChangeText={setOldPassword}
              />

              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Mật khẩu mới (tối thiểu 8 ký tự)</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.cardSecondary, color: theme.text }]}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={theme.subtext}
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Xác nhận mật khẩu mới</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.cardSecondary, color: theme.text }]}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={theme.subtext}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity 
                style={[styles.savePassBtn, submittingPass && {opacity: 0.6}]} 
                onPress={handleChangePassword}
                disabled={submittingPass}
              >
                {submittingPass ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.savePassBtnText}>Xác nhận đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL KHÓA TÀI KHOẢN */}
      <Modal visible={lockModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="lock-closed" size={22} color="#ea580c" style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Khóa tài khoản</Text>
              </View>
              <TouchableOpacity onPress={() => setLockModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.lockWarningBox, { backgroundColor: isDark ? '#271b12' : '#fff7ed', borderColor: isDark ? '#78350f' : '#fed7aa' }]}>
              <Ionicons name="alert-circle" size={20} color="#ea580c" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.lockWarningText, { color: isDark ? '#fed7aa' : '#9a3412' }]}>
                Sau khi khóa tài khoản, bạn sẽ bị đăng xuất ngay lập tức. Để mở khóa tài khoản, bạn cần liên hệ với Quản trị viên hệ thống.
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Nhập mật khẩu để xác nhận khóa:</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: theme.cardSecondary, color: theme.text, borderColor: theme.border }]}
                secureTextEntry
                placeholder="Nhập mật khẩu của bạn..."
                placeholderTextColor={theme.subtext}
                value={lockPassword}
                onChangeText={setLockPassword}
              />

              <TouchableOpacity 
                style={[styles.lockConfirmBtn, submittingLock && { opacity: 0.6 }]} 
                onPress={handleConfirmLockAccount}
                disabled={submittingLock}
              >
                {submittingLock ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.lockConfirmBtnText}>Xác nhận khóa tài khoản</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.lockCancelBtn, { borderColor: theme.border }]} 
                onPress={() => setLockModalVisible(false)}
                disabled={submittingLock}
              >
                <Text style={[styles.lockCancelBtnText, { color: theme.subtext }]}>Hủy bỏ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10 },
  statBox: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2 },
  statIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  statNumber: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

  menuContainer: { backgroundColor: '#ffffff', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, flex: 1, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },

  footer: { padding: 25, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9ca3af' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalBody: { gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4 },
  modalInput: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#111827' },
  savePassBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 15 },
  savePassBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  /* Lock Account Modal Styles */
  lockWarningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  lockWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  lockConfirmBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  lockConfirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  lockCancelBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  lockCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
