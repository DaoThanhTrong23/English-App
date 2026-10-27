import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal, Linking, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { notificationService } from '../service/notificationService';
import { axiosClient } from '../api/axiosClient';
import { useAppTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, theme, toggleDarkMode } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [habitTime, setHabitTime] = useState<string | null>(null);

  // Modals state
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [submittingLock, setSubmittingLock] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedNotif = await SecureStore.getItemAsync('notificationsEnabled');
        if (storedNotif !== null) {
          setNotificationsEnabled(storedNotif === 'true');
        }

        axiosClient.get('/student/notifications/preferred-time')
          .then((res) => {
            if (res.data?.success && res.data.data?.formattedTime) {
              setHabitTime(res.data.data.formattedTime);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.log('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await SecureStore.setItemAsync('notificationsEnabled', value ? 'true' : 'false');
    if (value) {
      const res = await notificationService.syncAndScheduleHabitReminder();
      const timeStr = res?.formattedTime || habitTime || '20:00';
      Alert.alert('Thành công', `Đã bật nhắc nhở học tập hàng ngày (tự động theo thói quen lúc ${timeStr})!`);
    } else {
      await notificationService.cancelAllNotifications();
      Alert.alert('Thông báo', 'Đã tắt nhắc nhở học tập.');
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await toggleDarkMode(value);
  };

  const openEmailSupport = () => {
    Linking.openURL('mailto:daothanhtrong42005@gmail.com?subject=Hỗ trợ học viên EngMaster').catch(() => {
      Alert.alert('Hỗ trợ EngMaster', 'Vui lòng gửi email trực tiếp tới: daothanhtrong42005@gmail.com');
    });
  };

  const openHotline = () => {
    Linking.openURL('tel:0939907163').catch(() => {
      Alert.alert('Hotline hỗ trợ', 'Số điện thoại hỗ trợ: 0939907163');
    });
  };

  const openLockModal = () => {
    setLockPassword('');
    setLockModalVisible(true);
  };

  const handleConfirmLockAccount = async () => {
    if (!lockPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu để xác nhận khóa tài khoản!");
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
          "Khóa tài khoản thành công",
          res.data.message || "Tài khoản của bạn đã được khóa thành công. Bạn cần liên hệ Quản trị viên để được mở khóa!",
          [
            {
              text: "Đồng ý",
              onPress: async () => {
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                await SecureStore.deleteItemAsync('userInfo');
                await SecureStore.deleteItemAsync('userAvatar');
                router.replace('/(auth)/login');
              }
            }
          ]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể khóa tài khoản lúc này, vui lòng kiểm tra lại mật khẩu!";
      Alert.alert("Khóa tài khoản thất bại", msg);
    } finally {
      setSubmittingLock(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt hệ thống</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SECTION: TÙY CHỌN TRẢI NGHIỆM */}
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Trải nghiệm ứng dụng</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* 1. THÔNG BÁO NHẮC NHỞ */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#27272a' : '#eff6ff' }]}>
                <Ionicons name="notifications" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Thông báo nhắc nhở</Text>
                <Text style={[styles.settingSubtext, { color: theme.subtext }]}>
                  {notificationsEnabled 
                    ? `Nhắc học tập mỗi ngày lúc ${habitTime || '20:00'}`
                    : 'Đang tắt thông báo'}
                </Text>
              </View>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={handleToggleNotifications} 
              trackColor={{ true: theme.primary, false: isDark ? '#3f3f46' : '#d1d5db' }} 
            />
          </View>


          <View style={[styles.settingDivider, { backgroundColor: theme.border }]} />

          {/* 3. CHẾ ĐỘ NỀN TỐI (DARK MODE HOẠT ĐỘNG THẬT 100%) */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#27272a' : '#f5f3ff' }]}>
                <Ionicons name="moon" size={20} color={isDark ? '#e4e4e7' : '#7c3aed'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Chế độ nền tối (Dark Mode)</Text>
                <Text style={[styles.settingSubtext, { color: theme.subtext }]}>
                  {isDark ? 'Đang bật • Đen sâu & Đen nhẹ dịu mắt' : 'Đang tắt • Giao diện sáng chuẩn'}
                </Text>
              </View>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={handleToggleDarkMode} 
              trackColor={{ true: '#3b82f6', false: isDark ? '#3f3f46' : '#d1d5db' }} 
            />
          </View>
        </View>

        {/* SECTION: HỖ TRỢ & THÔNG TIN */}
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Hỗ trợ & Thông tin</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.settingItem} 
            activeOpacity={0.7}
            onPress={() => setHelpModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#27272a' : '#fef3c7' }]}>
                <Ionicons name="help-circle" size={20} color={isDark ? '#facc15' : '#d97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Trung tâm trợ giúp (FAQ)</Text>
                <Text style={[styles.settingSubtext, { color: theme.subtext }]}>Câu hỏi thường gặp & Hướng dẫn sử dụng</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: theme.border }]} />

          <TouchableOpacity 
            style={styles.settingItem} 
            activeOpacity={0.7}
            onPress={() => setAboutModalVisible(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#27272a' : '#e0f2fe' }]}>
                <Ionicons name="information-circle" size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Về EngMaster</Text>
                <Text style={[styles.settingSubtext, { color: theme.subtext }]}>Phiên bản 1.0.0 • Khóa luận tốt nghiệp</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* SECTION: TÙY CHỌN KHÓA TÀI KHOẢN */}
        <TouchableOpacity 
          style={[
            styles.dangerBtn, 
            { 
              backgroundColor: isDark ? '#271b12' : '#fff7ed',
              borderColor: isDark ? '#78350f' : '#fed7aa',
            }
          ]} 
          onPress={openLockModal}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#ea580c" style={{ marginRight: 6 }} />
          <Text style={[styles.dangerText, { color: '#ea580c' }]}>Khóa tài khoản học viên</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL TRUNG TÂM TRỢ GIÚP */}
      <Modal visible={helpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Trung tâm trợ giúp</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={[styles.faqHeader, { color: theme.subtext }]}>Câu hỏi thường gặp</Text>

              <View style={[styles.faqCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>Làm sao để duy trì chuỗi ngày (Streak)?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  Mỗi ngày, bạn chỉ cần hoàn thành ít nhất 1 bài học hoặc hoàn thành 1 mini-game luyện từ trước 23:59. Hệ thống sẽ tự động ghi nhận và cộng 1 ngày streak vào hồ sơ của bạn.
                </Text>
              </View>

              <View style={[styles.faqCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>Điểm kinh nghiệm (XP) & Trình độ CEFR?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  Bạn nhận XP khi học từ vựng, vượt qua bài kiểm tra và chiến thắng mini-game. Trình độ CEFR (A1-C2) được cập nhật linh hoạt sau mỗi bài đánh giá thích ứng.
                </Text>
              </View>

              <View style={[styles.faqCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>Thuật toán FAME-KT & Spaced Repetition (SRS)?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  EngMaster sử dụng mô hình trí tuệ nhân tạo FAME-KT để cá nhân hóa lộ trình học, kết hợp thuật toán lặp lại ngắt quãng SRS tự động xếp lịch nhắc lại những từ vựng bạn sắp quên.
                </Text>
              </View>

              <Text style={[styles.faqHeader, { marginTop: 16, color: theme.subtext }]}>Kênh liên hệ hỗ trợ</Text>

              <TouchableOpacity 
                style={[styles.contactCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]} 
                onPress={openEmailSupport}
              >
                <Ionicons name="mail" size={22} color={theme.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: theme.subtext }]}>Email hỗ trợ kỹ thuật</Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>daothanhtrong42005@gmail.com</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={20} color={theme.primary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contactCard, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]} 
                onPress={openHotline}
              >
                <Ionicons name="call" size={22} color="#16a34a" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: theme.subtext }]}>Liên hệ</Text>
                  <Text style={[styles.contactValue, { color: theme.text }]}>0939907163</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={20} color="#16a34a" />
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]} 
              onPress={() => setHelpModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL VỀ ENGMASTER */}
      <Modal visible={aboutModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Về ứng dụng EngMaster</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <View style={[styles.aboutHero, { borderBottomColor: theme.border }]}>
                <Image 
                  source={require('../../assets/images/gacon.gif')} 
                  style={styles.aboutMascot} 
                />
                <Text style={[styles.aboutAppName, { color: isDark ? '#60a5fa' : '#1e3a8a' }]}>EngMaster</Text>
                <Text style={[styles.aboutVersion, { color: theme.subtext }]}>Phiên bản 1.0.0 (Build 2026.10)</Text>
                <Text style={[styles.aboutDesc, { color: theme.subtext }]}>
                  Hệ sinh thái học Tiếng Anh thông minh kết hợp Trí tuệ Nhân tạo & Knowledge Tracing thích ứng.
                </Text>
              </View>

              <View style={[styles.techSection, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}>
                <Text style={[styles.techSectionTitle, { color: theme.text }]}>Đồ án Khóa Luận Tốt Nghiệp</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• Chuyên ngành: Công nghệ Thông tin</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• Đề tài: Ứng dụng học Tiếng Anh</Text>
                
                <Text style={[styles.techSectionTitle, { marginTop: 14, color: theme.text }]}>Công nghệ & Thuật toán nổi bật</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• Mobile App: React Native & Expo</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• Backend API: Node.js, Express & Prisma ORM</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• AI Model: FAME-KT (Knowledge Tracing cá nhân hóa)</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• AI Chatbot: Trợ giảng thông minh đàm thoại thời gian thực</Text>
                <Text style={[styles.techText, { color: theme.subtext }]}>• Speech Recognition: Chấm điểm phát âm chuẩn bản ngữ</Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]} 
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Đóng</Text>
            </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setLockModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.lockWarningBox, { backgroundColor: isDark ? '#271b12' : '#fff7ed', borderColor: isDark ? '#78350f' : '#fed7aa' }]}>
              <Ionicons name="alert-circle" size={20} color="#ea580c" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.lockWarningText, { color: isDark ? '#fed7aa' : '#9a3412' }]}>
                Sau khi khóa tài khoản, bạn sẽ bị đăng xuất ngay lập tức. Để mở khóa tài khoản, bạn cần liên hệ với Quản trị viên hệ thống.
              </Text>
            </View>

            <Text style={[styles.lockInputLabel, { color: theme.subtext }]}>Nhập mật khẩu để xác nhận khóa:</Text>
            <TextInput
              style={[styles.lockInput, { backgroundColor: theme.cardSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Nhập mật khẩu của bạn..."
              placeholderTextColor={theme.subtext}
              secureTextEntry
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
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginTop: 10, 
    marginLeft: 4,
    letterSpacing: 0.5 
  },
  card: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 20, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 14 
  },
  settingLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingText: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingSubtext: { fontSize: 12 },
  settingDivider: { height: 1, marginLeft: 68 },
  
  dangerBtn: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, 
    marginTop: 10, 
    borderRadius: 14,
    borderWidth: 1,
  },
  dangerText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },

  /* FAQ Styles */
  faqHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  faqCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
  },

  /* Contact Cards */
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* About Modal Styles */
  aboutHero: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  aboutMascot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  aboutDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  techSection: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  techSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  techText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },

  modalDoneBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* Lock Account Modal Styles */
  lockWarningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  lockWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  lockInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  lockConfirmBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  lockConfirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  lockCancelBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  lockCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
