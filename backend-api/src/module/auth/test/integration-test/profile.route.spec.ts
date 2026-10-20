import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { profileRouter } from '../../profile.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { prisma } from '../../../../config/prisma.js';
import { studentLessonRepository } from '../../../student-lesson/student-lesson.repository.js';

let mockUser: { userId: number; role: string } | null = { userId: 1, role: 'user' };

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  },
}));

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    userTestResult: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    userAchievement: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../student-lesson/student-lesson.repository.js', () => ({
  studentLessonRepository: {
    calculateUserStreak: vi.fn().mockResolvedValue(5),
  },
}));

describe('Auth Profile Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { userId: 1, role: 'user' };
    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[PRF-01] GET /api/profile/me trả về 200 kèm đầy đủ các chỉ số thống kê từ vựng mới', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 1,
        username: 'learner1',
        email: 'learner1@example.com',
        role: 'user',
        avatarUrl: null,
        xpPoints: 450,
        cefrLevel: 'B1',
        onboardingCompleted: true,
      } as any);

      vi.mocked(prisma.userProgress.count)
        .mockResolvedValueOnce(15) // masteredWordsCount
        .mockResolvedValueOnce(25) // learningWordsCount
        .mockResolvedValueOnce(40); // totalSavedWordsCount

      vi.mocked(prisma.userTestResult.count).mockResolvedValue(8);
      vi.mocked(prisma.userAchievement.count).mockResolvedValue(3);
      vi.mocked(studentLessonRepository.calculateUserStreak).mockResolvedValue(7);

      const res = await request(app).get('/api/profile/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('learner1');
      expect(res.body.data.masteredWordsCount).toBe(15);
      expect(res.body.data.learningWordsCount).toBe(25);
      expect(res.body.data.totalSavedWordsCount).toBe(40);
      expect(res.body.data.completedTestsCount).toBe(8);
      expect(res.body.data.achievementsCount).toBe(3);
      expect(res.body.data.streak).toBe(7);
    });

    it('[PRF-02] GET /api/profile/saved-words trả về 200 kèm danh sách từ vựng đã lưu', async () => {
      vi.mocked(prisma.userProgress.findMany).mockResolvedValue([
        {
          id: 1,
          userId: 1,
          wordId: 10,
          status: 'learning',
          word: { id: 10, headword: 'apple', phonetic: '/ˈæp.əl/' },
        } as any,
        {
          id: 2,
          userId: 1,
          wordId: 11,
          status: 'mastered',
          word: { id: 11, headword: 'banana', phonetic: '/bəˈnæn.ə/' },
        } as any,
      ]);

      const res = await request(app).get('/api/profile/saved-words');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].word.headword).toBe('apple');
      expect(prisma.userProgress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          include: { word: true },
        })
      );
    });
  });

  describe('2. Bad End Cases', () => {
    it('[PRF-03] GET /api/profile/me khi người dùng không tồn tại trả về 404', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/api/profile/me');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('User not found');
    });

    it('[PRF-04] GET /api/profile/me khi chưa xác thực trả về 401 Unauthorized', async () => {
      mockUser = null;

      const res = await request(app).get('/api/profile/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });
  });

  describe('3. Concurrency Cases', () => {
    it('[PRF-05] 2 request song song lấy /me và /saved-words không gây nghẽn kết nối', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, username: 'learner1' } as any);
      vi.mocked(prisma.userProgress.count).mockResolvedValue(10);
      vi.mocked(prisma.userTestResult.count).mockResolvedValue(5);
      vi.mocked(prisma.userAchievement.count).mockResolvedValue(2);
      vi.mocked(prisma.userProgress.findMany).mockResolvedValue([]);

      const [r1, r2] = await Promise.all([
        request(app).get('/api/profile/me'),
        request(app).get('/api/profile/saved-words'),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });

  describe('4. Data Conflict & Network Failures', () => {
    it('[PRF-06] Mất kết nối DB khi đếm tiến độ /me trả về 500', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 1, username: 'learner1' } as any);
      vi.mocked(prisma.userProgress.count).mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/profile/me');

      expect(res.status).toBe(500);
    });

    it('[PRF-07] Lỗi hệ thống khi lấy danh sách saved-words trả về 500', async () => {
      vi.mocked(prisma.userProgress.findMany).mockRejectedValue(new Error('Database timeout'));

      const res = await request(app).get('/api/profile/saved-words');

      expect(res.status).toBe(500);
    });
  });
});
