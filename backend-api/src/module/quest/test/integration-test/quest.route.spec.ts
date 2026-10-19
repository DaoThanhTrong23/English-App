import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { questRouter } from '../../quest.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { prisma } from '../../../../config/prisma.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'user' };
    next();
  },
}));

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    userTestResult: { count: vi.fn() },
    gameHistory: { count: vi.fn() },
    activityLog: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

describe('Quest Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/student/quests', questRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[QST-IT-01] GET /api/student/quests/daily trả về danh sách nhiệm vụ và tiến độ', async () => {
      vi.mocked(prisma.userTestResult.count).mockResolvedValue(1);
      vi.mocked(prisma.gameHistory.count).mockResolvedValue(1);
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([]);

      const res = await request(app).get('/api/student/quests/daily');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quests.length).toBe(3);
      expect(res.body.data.completedCount).toBeGreaterThanOrEqual(1);
    });

    it('[QST-IT-02] POST /api/student/quests/claim nhận thưởng thành công nhiệm vụ login', async () => {
      vi.mocked(prisma.activityLog.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        { id: 1, username: 'testuser', xpPoints: 100 },
        { id: 10, actionType: 'CLAIM_DAILY_QUEST_QUEST_LOGIN' },
      ] as any);

      const res = await request(app)
        .post('/api/student/quests/claim')
        .send({ questId: 'quest_login' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.xpAwarded).toBe(10);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[QST-IT-03] POST /api/student/quests/claim questId không hợp lệ trả về 400', async () => {
      const res = await request(app)
        .post('/api/student/quests/claim')
        .send({ questId: 'invalid_quest_123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Nhiệm vụ không hợp lệ');
    });

    it('[QST-IT-04] POST /api/student/quests/claim chưa hoàn thành mục tiêu trả về 400', async () => {
      vi.mocked(prisma.activityLog.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.userTestResult.count).mockResolvedValue(0);

      const res = await request(app)
        .post('/api/student/quests/claim')
        .send({ questId: 'quest_test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Bạn chưa hoàn thành mục tiêu');
    });
  });

  describe('3. Concurrency & Double Claim Cases', () => {
    it('[QST-IT-05] POST /api/student/quests/claim đã nhận hôm nay trả về 400', async () => {
      vi.mocked(prisma.activityLog.findFirst).mockResolvedValue({
        id: 1,
        userId: 1,
        actionType: 'CLAIM_DAILY_QUEST_QUEST_LOGIN',
        description: null,
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/student/quests/claim')
        .send({ questId: 'quest_login' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Hôm nay bạn đã nhận phần thưởng này rồi!');
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[QST-IT-06] Lỗi kết nối DB trong transaction trả về 500 lỗi máy chủ', async () => {
      vi.mocked(prisma.activityLog.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Prisma connection lost (P1001)'));

      const res = await request(app)
        .post('/api/student/quests/claim')
        .send({ questId: 'quest_login' });

      expect(res.status).toBe(500);
    });
  });
});
