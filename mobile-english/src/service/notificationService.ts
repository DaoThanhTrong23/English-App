import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { axiosClient } from '../api/axiosClient';

// Cấu hình cách hiển thị thông báo khi ứng dụng đang mở (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Khởi tạo và xin quyền thông báo
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Quyền thông báo chưa được cấp');
        return false;
      }

      // Cấu hình Channel cho Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('study-reminder', {
          name: 'Nhắc nhở học tập',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Lỗi khi xin quyền thông báo:', error);
      return false;
    }
  },

  /**
   * Lên lịch thông báo nhắc học lặp lại hàng ngày vào khung giờ mong muốn
   * @param hour Giờ học (0 - 23, mặc định 20:00)
   * @param minute Phút (0 - 59, mặc định 0)
   */
  async scheduleDailyStudyReminder(hour = 20, minute = 0) {
    try {
      const isEnabled = await SecureStore.getItemAsync('notificationsEnabled');
      if (isEnabled === 'false') {
        console.log('[NotificationService] Người dùng đã tắt thông báo trong Cài đặt, bỏ qua lên lịch.');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Hủy các lịch nhắc học cũ để tránh lặp thông báo
      await Notifications.cancelAllScheduledNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Đã đến giờ học tiếng Anh!',
          body: 'Dành ra 15 phút mỗi ngày để nâng cao kỹ năng và duy trì chuỗi streak nhé!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'study-reminder',
        },
      });

      console.log(`Đã lên lịch nhắc nhở học tập hàng ngày vào lúc ${hour}:${minute < 10 ? '0' + minute : minute}`);
    } catch (error) {
      console.error('Lỗi khi lên lịch nhắc nhở:', error);
    }
  },

  /**
   * Đồng bộ và lên lịch nhắc học thông minh dựa trên thói quen (Fetch từ Backend)
   */
  async syncAndScheduleHabitReminder(): Promise<{ preferredHour: number; preferredMinute: number; formattedTime: string; totalLogins: number } | null> {
    try {
      const isEnabled = await SecureStore.getItemAsync('notificationsEnabled');
      if (isEnabled === 'false') {
        return null;
      }

      const res = await axiosClient.get('/student/notifications/preferred-time');
      if (res.data?.success && res.data.data) {
        const { preferredHour, preferredMinute, formattedTime, totalLogins } = res.data.data;
        await this.scheduleDailyStudyReminder(preferredHour, preferredMinute);
        console.log(`[SmartReminder] Đã đồng bộ giờ học thói quen từ server: ${formattedTime} (Tổng ${totalLogins} lần login)`);
        return { preferredHour, preferredMinute, formattedTime, totalLogins };
      }
    } catch (err) {
      console.log('Không thể lấy giờ học quen thuộc từ server, fallback 20:00:', err);
      await this.scheduleDailyStudyReminder(20, 0);
    }
    return null;
  },

  /**
   * Bắn ngay 1 thông báo hiển thị lên thanh thông báo / màn hình khóa
   */
  async triggerImmediateNotification(title: string, body: string) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: Platform.OS === 'android' ? { channelId: 'study-reminder' } : null,
      });
    } catch (error) {
      console.error('Lỗi khi gửi thông báo tức thì:', error);
    }
  },

  /**
   * Hủy tất cả lịch thông báo
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Đã hủy tất cả lịch thông báo');
    } catch (error) {
      console.error('Lỗi khi hủy thông báo:', error);
    }
  },
};
