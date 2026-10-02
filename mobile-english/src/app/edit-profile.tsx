import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { axiosClient } from '../api/axiosClient';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userInfoStr = await SecureStore.getItemAsync('userInfo');
      if (userInfoStr) {
        const user = JSON.parse(userInfoStr);
        setName(user.username || 'Học viên EngMaster');
        setEmail(user.email || 'student@engmaster.com');
      }
      const savedAvatar = await SecureStore.getItemAsync('userAvatar');
      if (savedAvatar) setAvatarUri(savedAvatar);
    } catch (error) {
      console.log('Error loading profile', error);
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Ứng dụng cần quyền truy cập camera để chụp ảnh!');
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
          Alert.alert('Lỗi', 'Ứng dụng cần quyền truy cập thư viện ảnh!');
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
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Đổi ảnh đại diện',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Chụp ảnh mới', onPress: () => pickImage(true) },
        { text: 'Chọn từ Thư viện', onPress: () => pickImage(false) },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('username', name);
      
      // Nếu user vừa chọn ảnh mới từ máy (chưa phải là link http)
      if (avatarUri && !avatarUri.startsWith('http')) {
        const localUri = avatarUri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('avatar', { uri: localUri, name: filename, type } as any);
      }

      // Gọi API Upload
      const res = await axiosClient.put('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const updatedUser = res.data.data;
        // Nối tên miền của backend vào URL ảnh
        const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
        const finalAvatarUri = updatedUser.avatarUrl ? baseURL + updatedUser.avatarUrl : null;
        
        if (finalAvatarUri) {
          await SecureStore.setItemAsync('userAvatar', finalAvatarUri);
        }
        await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUser));
        
        Alert.alert('Thành công', 'Đã cập nhật Avatar và thông tin lên DB!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể lưu lên Server');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImagePickerOptions} style={styles.avatarContainer}>
              <Image 
                source={avatarUri ? { uri: avatarUri } : require('../../assets/images/gacon.gif')} 
                style={styles.avatar} 
                
              />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên hiển thị</Text>
            <TextInput 
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên của bạn"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Không thể thay đổi)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: '#e2e8f0', color: '#64748b' }]}
              value={email}
              editable={false}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 24 },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', borderWidth: 3, borderColor: '#2563eb' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarHint: { marginTop: 12, fontSize: 14, color: '#64748b' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' },
  
  saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
