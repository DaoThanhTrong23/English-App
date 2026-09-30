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

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
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
      if (user) await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

      /* @ts-ignore */
      router.replace('/(tabs)');
    } catch (e: any) {
      console.log('SOCIAL LOGIN ERROR:', e);
      setErrorMsg('Đăng nhập MXH thất bại: ' + (e.response?.data?.message || e.message));
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
      if (user) await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

      /* @ts-ignore */
      router.replace('/(tabs)');
    } catch (e: any) {
      console.log('AUTH ERROR:', e);
      if (e.message === 'Network Error') {
        setErrorMsg('Không thể kết nối đến Server! Vui lòng kiểm tra IP mạng.');
      } else {
        setErrorMsg(e.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/gacon.gif')} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
        </View>

        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>Hãy đăng nhập để tiếp tục</Text>

        {errorMsg ? (
          <View style={{ backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 15, width: '100%' }}>
            <Text style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Email của bạn</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#9ca3af"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.passwordHeader}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TouchableOpacity><Text style={styles.forgotPassword}>Quên mật khẩu?</Text></TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="********"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          

          <TouchableOpacity style={styles.loginButton} onPress={handleAuth}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={() => gPromptAsync()} disabled={!gRequest}>
              <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Đang phát triển', 'Chức năng đăng nhập Apple đang được tích hợp.')}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => fbPromptAsync()} disabled={!fbRequest}>
              <Ionicons name="logo-facebook" size={24} color="#1877f2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.noAccountText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 40, textAlign: 'center' }}>
          Đang kết nối API: {axiosClient.defaults.baseURL}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoContainer: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 40 },
  formContainer: { width: '100%' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 20, backgroundColor: '#ffffff' },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, color: '#111827' },
  eyeIcon: { padding: 10, marginRight: 5 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotPassword: { fontSize: 12, color: '#2563eb', fontWeight: '500', marginBottom: 6 },
  loginButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  socialSection: { width: '100%', marginTop: 40 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 15, fontSize: 12, color: '#9ca3af' },
  socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  socialIcon: { width: 24, height: 24, resizeMode: 'contain' },
  registerContainer: { flexDirection: 'row', marginTop: 40 },
  noAccountText: { fontSize: 14, color: '#6b7280' },
  registerLink: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' }
});
