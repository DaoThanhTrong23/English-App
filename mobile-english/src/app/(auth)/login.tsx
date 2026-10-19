import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { axiosClient } from '../../api/axiosClient';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { useAppTheme } from '../../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Cấu hình Google Auth Session (Lấy id_token)
  const [gRequest, gResponse, gPromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '774080954802-jub4qqvp4eijmk5b04367fk4164omjk5.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'mobileenglish' }), // Thay bằng webClientId hoặc clientId phù hợp
  });

  // 2. Cấu hình Facebook Auth Session (Lấy access_token)
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '1417644583763676',
  });

  // Xử lý callback sau khi đăng nhập Google/Facebook thành công
  useEffect(() => {
    if (gResponse?.type === 'success') {
      const idToken = gResponse.params.id_token;
      if (idToken) handleSocialLogin('google', idToken);
    }
  }, [gResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const accessToken = fbResponse.authentication?.accessToken;
      if (accessToken) handleSocialLogin('facebook', accessToken);
    }
  }, [fbResponse]);

  const handleSocialLogin = async (provider: 'google' | 'facebook', token: string) => {
    try {
      const deviceInfo = Platform.OS;
      let res;
      if (provider === 'google') {
        res = await axiosClient.post('/auth/google', { idToken: token, deviceInfo });
      } else {
        res = await axiosClient.post('/auth/facebook', { accessToken: token, deviceInfo });
      }

      const { accessToken, refreshToken, user } = res.data.data || res.data;
      if (!accessToken) throw new Error('Không nhận được token từ server');

      await SecureStore.setItemAsync('accessToken', String(accessToken));
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', String(refreshToken));
      if (user) {
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        if (user.avatarUrl) {
          const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
          const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : baseURL + user.avatarUrl;
          await SecureStore.setItemAsync('userAvatar', avatar);
        } else {
          await SecureStore.deleteItemAsync('userAvatar').catch(() => {});
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
      const msg = e.response?.data?.message || e.response?.data?.error?.message || e.message;
      setErrorMsg('Đăng nhập MXH thất bại: ' + msg);
      if (String(msg).toLowerCase().includes('khóa')) {
        Alert.alert('Tài khoản bị khóa', String(msg));
      }
    }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    if (!identifier || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    

    try {
      const deviceInfo = Platform.OS;
      
      const res = await axiosClient.post('/auth/login', {
        identifier: identifier,
        password,
        deviceInfo
      });
      
      
      const { accessToken, refreshToken, user } = res.data.data?.token ? { accessToken: res.data.data.token.accessToken, refreshToken: res.data.data.token.refreshToken, user: res.data.data.user } : res.data.data;
      
      if (!accessToken) {
        setErrorMsg('Lỗi từ Server: Không trả về Token đăng nhập.');
        return;
      }

      if (user?.role === 'admin') {
        setErrorMsg('Tài khoản Admin không được phép đăng nhập trên thiết bị di động!');
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
          await SecureStore.deleteItemAsync('userAvatar').catch(() => {});
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
          <Text style={[styles.inputLabel, { color: theme.text }]}>Email của bạn</Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="example@gmail.com"
              placeholderTextColor={theme.subtext}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
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
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => gPromptAsync()} disabled={!gRequest}>
              <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Alert.alert('Đang phát triển', 'Chức năng đăng nhập Apple đang được tích hợp.')}>
              <Ionicons name="logo-apple" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => fbPromptAsync()} disabled={!fbRequest}>
              <Ionicons name="logo-facebook" size={24} color="#1877f2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <Text style={[styles.noAccountText, { color: theme.subtext }]}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 40, textAlign: 'center' }}>
          Đang kết nối API: {axiosClient.defaults.baseURL}
        </Text>
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
