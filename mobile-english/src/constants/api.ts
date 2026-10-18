import { Platform } from 'react-native';

/**
 * Cấu hình API_URL linh hoạt:
 * 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL (khi build hoặc cấu hình qua file .env)
 * 2. Mặc định fallback IP mạng LAN để hỗ trợ Expo Go trên máy thật qua Wi-Fi
 */
const getBaseApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // IP mạng LAN hiện tại của máy chủ backend
  return 'http://192.168.0.102:3000/api';
};

export const API_URL = getBaseApiUrl();
