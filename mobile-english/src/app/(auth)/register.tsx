import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
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

export default function RegisterScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái kiểm tra trùng lặp email và username
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce kiểm tra trùng tên đăng nhập
  useEffect(() => {
    const cleanUser = username.trim();
    if (!cleanUser) {
      setUsernameError('');
      setIsUsernameValid(false);
      return;
    }

    if (cleanUser.length < 3) {
      setIsUsernameValid(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUser)) {
      setUsernameError('Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (_)');
      setIsUsernameValid(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingUsername(true);
        const res = await axiosClient.get(`/auth/check-availability?username=${encodeURIComponent(cleanUser)}`);
        if (res.data?.data) {
          if (!res.data.data.usernameAvailable) {
            setUsernameError(res.data.data.usernameMessage || 'Tên đăng nhập này đã tồn tại');
            setIsUsernameValid(false);
          } else {
            setUsernameError('');
            setIsUsernameValid(true);
          }
        }
      } catch (err) {
        // Bỏ qua lỗi mạng trong lúc gõ phím
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  // Debounce kiểm tra trùng Email
  useEffect(() => {
    const cleanMail = email.trim().toLowerCase();
    if (!cleanMail) {
      setEmailError('');
      setIsEmailValid(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanMail)) {
      setEmailError('Email không đúng định dạng (ví dụ: example@gmail.com)');
      setIsEmailValid(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingEmail(true);
        const res = await axiosClient.get(`/auth/check-availability?email=${encodeURIComponent(cleanMail)}`);
        if (res.data?.data) {
          if (!res.data.data.emailAvailable) {
            setEmailError(res.data.data.emailMessage || 'Email này đã được sử dụng');
            setIsEmailValid(false);
          } else {
            setEmailError('');
            setIsEmailValid(true);
          }
        }
      } catch (err) {
        // Bỏ qua lỗi mạng trong lúc gõ phím
      } finally {
        setIsCheckingEmail(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [email]);

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
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự!');
      return;
    }

    if (trimmedUsername.length > 50) {
      setErrorMsg('Tên đăng nhập tối đa 50 ký tự!');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setErrorMsg('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới (_)!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Email không đúng định dạng!');
      return;
    }

    // Kiểm tra nhanh trạng thái lỗi trùng lặp đã được phát hiện trước đó
    if (usernameError) {
      setErrorMsg(usernameError);
      return;
    }

    if (emailError) {
      setErrorMsg(emailError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp!');
      return;
    }
    // Regex check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMsg('Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.');
      return;
    }

    try {
      setIsSubmitting(true);
      const deviceInfo = Platform.OS;
      
      // Handle Register với username và email do học viên tự nhập
      const res = await axiosClient.post('/auth/register', {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        deviceInfo
      });
      
      let tokenData = res.data.data?.token 
        ? { accessToken: res.data.data.token.accessToken, refreshToken: res.data.data.token.refreshToken, user: res.data.data.user } 
        : res.data.data;
      
      let accessToken = tokenData?.accessToken;
      let refreshToken = tokenData?.refreshToken;
      let user = tokenData?.user;

      // Fallback: Nếu vì lý do nào đó server không trả token, tự động đăng nhập với thông tin vừa đăng ký
      if (!accessToken) {
        try {
          const loginRes = await axiosClient.post('/auth/login', {
            identifier: trimmedUsername,
            password,
            deviceInfo
          });
          const loginData = loginRes.data.data?.token 
            ? { accessToken: loginRes.data.data.token.accessToken, refreshToken: loginRes.data.data.token.refreshToken, user: loginRes.data.data.user } 
            : loginRes.data.data;
          accessToken = loginData?.accessToken;
          refreshToken = loginData?.refreshToken;
          user = loginData?.user || user;
        } catch (loginErr) {
          console.log('AUTO LOGIN FALLBACK ERROR:', loginErr);
        }
      }

      if (!accessToken) {
        // Tài khoản đã được tạo thành công trên DB -> Thông báo chuyển trang đăng nhập thay vì báo lỗi
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản của bạn đã được tạo thành công! Vui lòng đăng nhập để bắt đầu học.',
          [
            {
              text: 'Đăng nhập ngay',
              onPress: () => router.replace('/(auth)/login')
            }
          ]
        );
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

      // Người dùng mới đăng ký luôn chuyển qua Onboarding để khảo sát trình độ
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
        const errorData = e.response?.data;
        const serverMsg = errorData?.message || errorData?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại!';
        const errorCode = errorData?.error?.code;

        setErrorMsg(serverMsg);

        if (errorCode === 'credential_already_exists' || (serverMsg.toLowerCase().includes('email') && (serverMsg.toLowerCase().includes('tên đăng nhập') || serverMsg.toLowerCase().includes('username')))) {
          setEmailError('Email này đã được sử dụng.');
          setUsernameError('Tên đăng nhập này đã tồn tại.');
          Alert.alert('Không thể tạo tài khoản', 'Cả Email và Tên đăng nhập này đều đã được đăng ký tài khoản khác. Vui lòng chọn thông tin khác.');
        } else if (errorCode === 'email_already_exists' || serverMsg.toLowerCase().includes('email')) {
          setEmailError(serverMsg);
          Alert.alert('Không thể tạo tài khoản', serverMsg);
        } else if (errorCode === 'username_already_exists' || serverMsg.toLowerCase().includes('tên đăng nhập') || serverMsg.toLowerCase().includes('username')) {
          setUsernameError(serverMsg);
          Alert.alert('Không thể tạo tài khoản', serverMsg);
        } else {
          Alert.alert('Không thể tạo tài khoản', serverMsg);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/gacon.gif')} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Tạo tài khoản mới</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Đăng ký để học tiếng Anh cùng EngMaster</Text>

        {errorMsg ? (
          <View style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', padding: 12, borderRadius: 10, marginBottom: 15, width: '100%', borderWidth: 1, borderColor: '#ef4444' }}>
            <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Tên đăng nhập</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.inputBg, 
            borderColor: usernameError ? '#ef4444' : (isUsernameValid ? '#22c55e' : theme.border) 
          }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="vd: hocvien_123"
              placeholderTextColor={theme.subtext}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setUsernameError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isCheckingUsername ? (
              <ActivityIndicator size="small" color={theme.subtext} style={{ marginRight: 12 }} />
            ) : isUsernameValid ? (
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12 }} />
            ) : usernameError ? (
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 12 }} />
            ) : null}
          </View>
          {usernameError ? (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: -14, marginBottom: 14, marginLeft: 4 }}>
              {usernameError}
            </Text>
          ) : null}

          <Text style={[styles.inputLabel, { color: theme.text }]}>Email của bạn</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.inputBg, 
            borderColor: emailError ? '#ef4444' : (isEmailValid ? '#22c55e' : theme.border) 
          }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="example@gmail.com"
              placeholderTextColor={theme.subtext}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {isCheckingEmail ? (
              <ActivityIndicator size="small" color={theme.subtext} style={{ marginRight: 12 }} />
            ) : isEmailValid ? (
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12 }} />
            ) : emailError ? (
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 12 }} />
            ) : null}
          </View>
          {emailError ? (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: -14, marginBottom: 14, marginLeft: 4 }}>
              {emailError}
            </Text>
          ) : null}

          <View style={styles.passwordHeader}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Mật khẩu</Text>
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

          <Text style={[styles.inputLabel, { color: theme.text }]}>Nhập lại mật khẩu</Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.inputText }]}
              placeholder="********"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: isSubmitting ? '#93c5fd' : theme.primary }]} 
            onPress={handleAuth}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.subtext }]}>Hoặc đăng ký bằng</Text>
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
          <Text style={[styles.noAccountText, { color: theme.subtext }]}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Đăng nhập</Text>
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
