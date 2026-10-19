import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { communityRouter } from '../../community.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { communityService } from '../../community.service.js';
import { mockCommunityPost, mockCommunityComment } from '../data-mock/community.mock.js';

vi.mock('../../../../middleware/authenticate.middleware.js', () => ({
  Authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, role: 'student' };
    next();
  },
}));

describe('Community Routes - Integration Tests (QC 10-Year Standard)', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/community', communityRouter);
    app.use(errorHandler);
  });

  describe('1. Happy Cases', () => {
    it('[COM-IT-01] GET /api/community/posts lấy danh sách bài viết', async () => {
      vi.spyOn(communityService, 'getPosts').mockResolvedValue({
        posts: [mockCommunityPost as any],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const res = await request(app).get('/api/community/posts?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('[COM-IT-02] POST /api/community/posts tạo bài viết mới', async () => {
      vi.spyOn(communityService, 'createPost').mockResolvedValue(mockCommunityPost as any);

      const res = await request(app)
        .post('/api/community/posts')
        .send({ content: 'Bài viết chia sẻ kiến thức' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });

    it('[COM-IT-03] POST /api/community/posts/:id/like toggle like bài viết', async () => {
      vi.spyOn(communityService, 'toggleLike').mockResolvedValue({ hasLiked: true });

      const res = await request(app).post('/api/community/posts/1/like');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasLiked).toBe(true);
    });

    it('[COM-IT-04] POST /api/community/posts/:id/comments thêm bình luận', async () => {
      vi.spyOn(communityService, 'createComment').mockResolvedValue(mockCommunityComment as any);

      const res = await request(app)
        .post('/api/community/posts/1/comments')
        .send({ content: 'Hay quá bạn ơi' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
    });
  });

  describe('2. Bad End Cases', () => {
    it('[COM-IT-05] POST /api/community/posts không có content và image trả về 400', async () => {
      const res = await request(app)
        .post('/api/community/posts')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('[COM-IT-06] POST /api/community/posts/:id/comments nội dung rỗng trả về 400', async () => {
      const res = await request(app)
        .post('/api/community/posts/1/comments')
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Network Failures', () => {
    it('[COM-IT-07] Mất kết nối database khi lấy danh sách bài viết trả về 500', async () => {
      vi.spyOn(communityService, 'getPosts').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/community/posts');

      expect(res.status).toBe(500);
    });
  });
});
