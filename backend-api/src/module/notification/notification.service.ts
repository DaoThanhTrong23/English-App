import { prisma } from "../../config/prisma.js";

export class NotificationService {
  /**
   * Tạo thông báo gửi đến toàn bộ Quản trị viên (Admin)
   */
  async notifyAdmins(title: string, body: string) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { name: 'admin' } },
        select: { id: true }
      });
      if (!admins || admins.length === 0) return;

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title,
          body,
          isRead: false
        }))
      });
    } catch (error) {
      console.error("[NotificationService] Lỗi khi tạo thông báo cho Admin:", error);
    }
  }

  /**
   * Lấy danh sách thông báo và số lượng chưa đọc của một người dùng
   */
  async getNotifications(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Nếu là Admin và chưa có thông báo nào, tự động backfill từ các sự kiện hệ thống gần đây
    if (user?.role?.name === 'admin' && notifications.length === 0) {
      await this.backfillAdminNotifications(userId);
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return {
      unreadCount,
      notifications
    };
  }

  /**
   * Tự động sinh thông báo mẫu từ hoạt động thực tế của hệ thống
   */
  private async backfillAdminNotifications(adminUserId: number) {
    try {
      const recentStudents = await prisma.user.findMany({
        where: { role: { name: 'user' } },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const initialNotifications = [];

      for (const st of recentStudents) {
        initialNotifications.push({
          userId: adminUserId,
          title: "Học viên mới đăng ký 🎉",
          body: `Học viên ${st.username} (${st.email}) vừa tham gia vào hệ thống EnglishApp.`,
          isRead: false,
          createdAt: st.createdAt
        });

        if (st.cefrLevel) {
          initialNotifications.push({
            userId: adminUserId,
            title: "Học viên được xếp hạng trình độ 🎓",
            body: `Học viên ${st.username} đã hoàn thành đánh giá ban đầu và đạt trình độ ${st.cefrLevel}.`,
            isRead: false,
            createdAt: new Date(st.createdAt.getTime() + 1000 * 60 * 15)
          });
        }

        if (st.isLocked) {
          initialNotifications.push({
            userId: adminUserId,
            title: "Tài khoản học viên bị khóa 🔒",
            body: `Tài khoản học viên ${st.username} đã bị khóa trạng thái truy cập.`,
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      if (initialNotifications.length > 0) {
        await prisma.notification.createMany({
          data: initialNotifications
        });
      }
    } catch (e) {
      console.warn("Backfill admin notifications skipped:", e);
    }
  }

  async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async deleteNotification(id: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { id, userId }
    });
  }

  async clearAll(userId: number) {
    return prisma.notification.deleteMany({
      where: { userId }
    });
  }
}

export const notificationService = new NotificationService();
