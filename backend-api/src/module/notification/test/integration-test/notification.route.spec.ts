import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { notificationRouter } from '../../notification.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { notificationService } from '../../notification.service.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'user' };
    next();
  },
}));

describe('Notification Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[NTF-IT-01] GET /api/notifications trả về danh sách thông báo và số lượng chưa đọc', async () => {
      vi.spyOn(notificationService, 'getNotifications').mockResolvedValue({
        unreadCount: 1,
        notifications: [{ id: 1, title: 'Test Notif', isRead: false } as any],
      });

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(1);
    });

    it('[NTF-IT-02] PUT /api/notifications/read-all đánh dấu tất cả đã đọc', async () => {
      vi.spyOn(notificationService, 'markAllAsRead').mockResolvedValue({ count: 5 } as any);

      const res = await request(app).put('/api/notifications/read-all');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('[NTF-IT-03] DELETE /api/notifications/clear-all xóa toàn bộ thông báo', async () => {
      vi.spyOn(notificationService, 'clearAll').mockResolvedValue({ count: 10 } as any);

      const res = await request(app).delete('/api/notifications/clear-all');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Network Failures', () => {
    it('[NTF-IT-05] Mất kết nối DB khi lấy thông báo trả về 500', async () => {
      vi.spyOn(notificationService, 'getNotifications').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/notifications');

      expect(res.status).toBe(500);
    });
  });
});
