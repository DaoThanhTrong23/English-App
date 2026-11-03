import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * ============================================================
 * CẤU HÌNH ĐƯỜNG DẪN MÁY CHỦ (SERVER BASE URL)
 * ============================================================
 * - NẾU CÙNG WI-FI (Chạy Expo Go): Để NGROK_URL = '', app sẽ TỰ ĐỘNG nhận diện IP máy tính
 * - NẾU BUILD APK TEST LOCAL: Cập nhật LOCAL_LAN_IP bên dưới thành IPv4 của máy tính (hoặc bấm trực tiếp vào dòng "Đang kết nối API" ở màn hình Đăng nhập để đổi IP ngay trên điện thoại không cần build lại APK)
 * - NẾU KHÁC MẠNG / DÙNG 4G: Chạy localtunnel/ngrok và dán link vào NGROK_URL
 */
const NGROK_URL: string = ''; // <-- Để trống khi điện thoại & máy tính cùng bắt chung 1 mạng Wi-Fi
const LOCAL_LAN_IP: string = '192.168.2.22'; // <-- Địa chỉ IPv4 LAN của máy tính chạy Backend

export const normalizeApiUrl = (rawUrl: string): string => {
  let cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // Nếu chỉ nhập IP (VD: 192.168.1.5 hoặc 192.168.1.5:3000)
    cleanUrl = `http://${cleanUrl}`;
  }
  // Nếu chưa có port và là IP nội bộ, tự gắn :3000
  const hostPart = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];
  if (!hostPart.includes(':') && (/^\d+\.\d+\.\d+\.\d+$/.test(hostPart) || hostPart === 'localhost')) {
    cleanUrl = cleanUrl.replace(hostPart, `${hostPart}:3000`);
  }
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const getBaseApiUrl = (): string => {
  // 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL nếu có
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  // 2. Nếu có link Tunnel công khai (ngrok / localtunnel)
  if (NGROK_URL && NGROK_URL.trim() !== '') {
    return normalizeApiUrl(NGROK_URL);
  }

  // 3. Tự động trích xuất IP máy tính từ kết nối Expo Metro (Chạy trên Expo Go)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000/api`;
    }
  }

  // 4. Fallback CHỈ dành cho máy ảo Android Emulator (Device.isDevice === false)
  // Lưu ý: Trên điện thoại Android thật khi cài APK, Device.isDevice là true nên sẽ đi tiếp xuống bước 5!
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:3000/api';
  }

  // 5. Fallback địa chỉ IP mạng nội bộ của máy tính (Dùng khi cài APK lên máy thật)
  return `http://${LOCAL_LAN_IP}:3000/api`;
};

export let API_URL = getBaseApiUrl();

export const setRuntimeApiUrl = (newUrl: string): string => {
  API_URL = normalizeApiUrl(newUrl);
  return API_URL;
};

export const getDefaultApiUrl = (): string => getBaseApiUrl();
