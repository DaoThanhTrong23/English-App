import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { axiosClient, initSavedApiUrl, updateServerApiUrl } from '../../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { useAppTheme } from '../../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '774080954802-jub4qqvp4eijmk5b04367fk4164omjk5.apps.googleusercontent.com';
const FACEBOOK_APP_ID = '1417644583763676';

export default function LoginScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState(axiosClient.defaults.baseURL || '');
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverInput, setServerInput] = useState('');
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    initSavedApiUrl().then((url) => {
      setCurrentApiUrl(url);
      setServerInput(url);
    });
  }, []);

  // 1. Cấu hình Google Auth Session (Lấy id_token)
  const [gRequest, gResponse, gPromptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({ scheme: 'mobileenglish' }),
  });

  // 2. Cấu hình Facebook Auth Session (Lấy access_token)
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['public_profile', 'email'],
    redirectUri: makeRedirectUri({ scheme: 'mobileenglish' }),
  });

  // Xử lý callback sau khi đăng nhập Google/Facebook thành công
  useEffect(() => {
    if (gResponse?.type === 'success') {
      const idToken = (gResponse.params as any)?.id_token || (gResponse as any).authentication?.idToken;
      if (idToken) {
        handleSocialLogin('google', idToken);
      } else {
        setErrorMsg('Không tìm thấy id_token từ phản hồi Google.');
      }
    } else if (gResponse?.type === 'error') {
      setErrorMsg('Đăng nhập Google thất bại: ' + ((gResponse.error as any)?.message || (gResponse.error as any)?.error_description || 'Lỗi không xác định'));
    }
  }, [gResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const accessToken = fbResponse.authentication?.accessToken || (fbResponse.params as any)?.access_token;
      if (accessToken) {
        handleSocialLogin('facebook', accessToken);
      } else {
        setErrorMsg('Không tìm thấy access_token từ Facebook.');
      }
    } else if (fbResponse?.type === 'error') {
      setErrorMsg('Đăng nhập Facebook thất bại: ' + ((fbResponse.error as any)?.message || (fbResponse.error as any)?.error_description || 'Lỗi không xác định'));
    }
  }, [fbResponse]);

  const handleSocialLogin = async (provider: 'google' | 'facebook', token: string) => {
    try {
      setSocialLoading(provider);
      setErrorMsg('');
      const deviceInfo = Platform.OS;
      let res;
      if (provider === 'google') {
        res = await axiosClient.post('/auth/google', { idToken: token, deviceInfo });
      } else {
        res = await axiosClient.post('/auth/facebook', { accessToken: token, deviceInfo });
      }

      const rawData = res.data?.data || res.data;
      const accessToken = rawData?.token?.accessToken || rawData?.accessToken;
      const refreshToken = rawData?.token?.refreshToken || rawData?.refreshToken;
      const user = rawData?.user;

      if (!accessToken) throw new Error('Không nhận được token từ máy chủ');
      if (user && String(user.role || '').toLowerCase() !== 'user') {
        Alert.alert('Truy cập bị từ chối', 'Tài khoản Quản trị viên/Nhân viên không được phép đăng nhập ứng dụng dành cho học viên!');
        return;
      }

      await SecureStore.setItemAsync('accessToken', String(accessToken));
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', String(refreshToken));
      if (user) {
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        if (user.avatarUrl) {
          const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
          const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : baseURL + user.avatarUrl;
          await SecureStore.setItemAsync('userAvatar', avatar);
        } else {
          await SecureStore.deleteItemAsync('userAvatar').catch(() => { });
        }
      }

      if (user && user.onboardingCompleted === false) {
        /* @ts-ignore */
        router.replace('/onboarding');
      } else {
        /* @ts-ignore */
        router.replace('/(tabs)');
      }

    } catch (e: any) {
      console.log('SOCIAL LOGIN ERROR:', e);
      const msg = e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Đăng nhập mạng xã hội thất bại';
      setErrorMsg('Đăng nhập MXH thất bại: ' + msg);
      if (String(msg).toLowerCase().includes('khóa')) {
        Alert.alert('Tài khoản bị khóa', String(msg));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const deviceInfo = Platform.OS;

      const res = await axiosClient.post('/auth/login', {
        identifier: trimmedIdentifier,
        password,
        deviceInfo
      });

      const { accessToken, refreshToken, user } = res.data.data?.token ? { accessToken: res.data.data.token.accessToken, refreshToken: res.data.data.token.refreshToken, user: res.data.data.user } : res.data.data;

      if (!accessToken) {
        setErrorMsg('Lỗi từ Server: Không trả về Token đăng nhập.');
        return;
      }

      if (user && String(user.role || '').toLowerCase() !== 'user') {
        setErrorMsg('Tài khoản Quản trị viên/Nhân viên không được phép đăng nhập ứng dụng dành cho học viên!');
        return;
      }

      await SecureStore.setItemAsync('accessToken', String(accessToken));
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', String(refreshToken));
      if (user) {
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        if (user.avatarUrl) {
          const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
          const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : baseURL + user.avatarUrl;
          await SecureStore.setItemAsync('userAvatar', avatar);
        } else {
          await SecureStore.deleteItemAsync('userAvatar').catch(() => { });
        }
      }

      if (user && user.onboardingCompleted === false) {
        /* @ts-ignore */
        router.replace('/onboarding');
      } else {
        /* @ts-ignore */
        router.replace('/(tabs)');
      }

    } catch (e: any) {
      console.log('AUTH ERROR:', e);
      if (e.message === 'Network Error') {
        setErrorMsg('Không thể kết nối đến Server! Vui lòng kiểm tra IP mạng.');
      } else {
        const msg = e.response?.data?.message || e.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại!';
        setErrorMsg(msg);
        if (String(msg).toLowerCase().includes('khóa')) {
          Alert.alert('Tài khoản bị khóa', String(msg));
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/gacon.gif')} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Chào mừng trở lại</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Hãy đăng nhập để tiếp tục</Text>

        {errorMsg ? (
          <View style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' }}>
            <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Email hoặc tên đăng nhập</Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="Nhập email hoặc tên đăng nhập"
              placeholderTextColor={theme.subtext}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.passwordHeader}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Mật khẩu</Text>
            <TouchableOpacity><Text style={[styles.forgotPassword, { color: theme.primary }]}>Quên mật khẩu?</Text></TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="********"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary }]} onPress={handleAuth}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.subtext }]}>Hoặc đăng nhập bằng</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={() => gPromptAsync()} 
              disabled={!gRequest || !!socialLoading}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator size="small" color="#ea4335" />
              ) : (
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={() => fbPromptAsync()} 
              disabled={!fbRequest || !!socialLoading}
            >
              {socialLoading === 'facebook' ? (
                <ActivityIndicator size="small" color="#1877f2" />
              ) : (
                <Ionicons name="logo-facebook" size={24} color="#1877f2" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <Text style={[styles.noAccountText, { color: theme.subtext }]}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setServerInput(currentApiUrl);
            setShowServerModal(true);
          }}
          style={{ marginTop: 40, paddingVertical: 8, paddingHorizontal: 12 }}
        >
          <Text style={{ fontSize: 11, color: theme.subtext, textAlign: 'center', textDecorationLine: 'underline' }}>
            Đang kết nối API: {currentApiUrl} (Chạm để đổi IP)
          </Text>
        </TouchableOpacity>

        <Modal visible={showServerModal} transparent animationType="fade" onRequestClose={() => setShowServerModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 6 }}>
                Cấu hình địa chỉ Server (Local / Tunnel)
              </Text>
              <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 14 }}>
                Nhập IP máy tính (VD: 192.168.1.10) hoặc đường dẫn đầy đủ (http://192.168.2.22:3000/api)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  color: theme.inputText,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  marginBottom: 16,
                }}
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="VD: 192.168.2.22 hoặc http://192.168.2.22:3000/api"
                placeholderTextColor={theme.subtext}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const resetUrl = await updateServerApiUrl(null);
                    setCurrentApiUrl(resetUrl);
                    setServerInput(resetUrl);
                    setErrorMsg('');
                    setShowServerModal(false);
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                >
                  <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '600' }}>Mặc định</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowServerModal(false)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                >
                  <Text style={{ color: theme.subtext, fontSize: 13, fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const updated = await updateServerApiUrl(serverInput);
                    setCurrentApiUrl(updated);
                    setErrorMsg('');
                    setShowServerModal(false);
                  }}
                  style={{ backgroundColor: theme.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Lưu kết nối</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoContainer: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 40 },
  formContainer: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 20 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14 },
  eyeIcon: { padding: 10, marginRight: 5 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotPassword: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  loginButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  socialSection: { width: '100%', marginTop: 40 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontSize: 12 },
  socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  socialIcon: { width: 24, height: 24, resizeMode: 'contain' },
  registerContainer: { flexDirection: 'row', marginTop: 40 },
  noAccountText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: 'bold' }
});
