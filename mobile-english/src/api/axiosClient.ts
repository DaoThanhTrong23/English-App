import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàng đợi xử lý Concurrency Lock tránh gọi refresh token nhiều lần cùng lúc
let isRefreshing = false;
let isLockAlertShown = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không kích hoạt Refresh Token nếu đang ở API Login hoặc Register
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    // Xử lý lập tức khi phát hiện tài khoản bị Admin khóa (403 account_locked)
    const errorData = error.response?.data;
    const isLockedError =
      error.response?.status === 403 &&
      (errorData?.error?.code === 'account_locked' ||
       errorData?.code === 'account_locked' ||
       String(errorData?.message || '').toLowerCase().includes('khóa') ||
       String(errorData?.error?.message || '').toLowerCase().includes('khóa'));

    if (isLockedError) {
      await SecureStore.deleteItemAsync('accessToken').catch(() => {});
      await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
      await SecureStore.deleteItemAsync('userInfo').catch(() => {});
      await SecureStore.deleteItemAsync('userAvatar').catch(() => {});

      if (!isLockAlertShown) {
        isLockAlertShown = true;
        const lockMessage =
          errorData?.message ||
          errorData?.error?.message ||
          'Tài khoản của bạn đã bị Quản trị viên khóa. Bạn đã bị đăng xuất khỏi ứng dụng!';

        Alert.alert(
          'Tài khoản bị khóa',
          lockMessage,
          [
            {
              text: 'Đã hiểu',
              onPress: () => {
                isLockAlertShown = false;
                router.replace('/(auth)/login');
              }
            }
          ],
          { cancelable: false }
        );
      }
      router.replace('/(auth)/login');
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      // Nếu đã có 1 request đang refresh, các request song song khác xếp hàng chờ
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const oldAccessToken = await SecureStore.getItemAsync('accessToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: refreshToken },
          {
            headers: oldAccessToken ? { Authorization: `Bearer ${oldAccessToken}` } : {}
          }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        const newRefreshToken = refreshResponse.data.data.refreshToken;

        await SecureStore.setItemAsync('accessToken', String(newAccessToken));
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', String(newRefreshToken));
        }

        processQueue(null, String(newAccessToken));
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync('accessToken').catch(() => {});
        await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
        await SecureStore.deleteItemAsync('userInfo').catch(() => {});
        await SecureStore.deleteItemAsync('userAvatar').catch(() => {});
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
