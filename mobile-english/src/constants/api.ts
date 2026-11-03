import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * ============================================================
 * CẤU HÌNH ĐƯỜNG DẪN MÁY CHỦ (SERVER BASE URL)
 * ============================================================
 * - NẾU CÙNG WI-FI: Để NGROK_URL = '', app sẽ TỰ ĐỘNG nhận diện IP máy tính
 * - NẾU KHÁC MẠNG / DÙNG 4G:
 *    + Cách 1: Chạy `npm run tunnel` ở backend-api (tự động cập nhật vào .env)
 *    + Cách 2: Dán trực tiếp link ngrok vào NGROK_URL bên dưới
 */
const NGROK_URL: string = ''; // <-- Dán link ngrok nếu muốn cấu hình cứng (ví dụ: https://xyz.ngrok-free.dev)

const getBaseApiUrl = (): string => {
  // 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL nếu có (từ file .env do npm run tunnel tự tạo)
  if (process.env.EXPO_PUBLIC_API_URL) {
<<<<<<< HEAD
    return normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
=======
    const raw = process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
>>>>>>> 955acf418ff963b8aeb5749da330e4a33a7093a4
  }

  // 2. Nếu có link Tunnel công khai (ngrok / localtunnel)
  if (NGROK_URL && NGROK_URL.trim() !== '') {
    return normalizeApiUrl(NGROK_URL);
  }

<<<<<<< HEAD
  // 3. Tự động trích xuất IP máy tính từ kết nối Expo Metro (Chạy trên Expo Go)
=======
  // 3. Tự động trích xuất IP máy tính từ kết nối Expo Metro (Chạy mượt nhất cho iPhone & Android thật khi cùng Wi-Fi)
>>>>>>> 955acf418ff963b8aeb5749da330e4a33a7093a4
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

<<<<<<< HEAD
  // 5. Fallback địa chỉ IP mạng nội bộ của máy tính (Dùng khi cài APK lên máy thật)
  return `http://${LOCAL_LAN_IP}:3000/api`;
};

export let API_URL = getBaseApiUrl();

export const setRuntimeApiUrl = (newUrl: string): string => {
  API_URL = normalizeApiUrl(newUrl);
  return API_URL;
=======
  // 5. Fallback địa chỉ IP mạng nội bộ của máy tính
  return 'http://192.168.100.5:3000/api';
>>>>>>> 955acf418ff963b8aeb5749da330e4a33a7093a4
};

export const getDefaultApiUrl = (): string => getBaseApiUrl();
