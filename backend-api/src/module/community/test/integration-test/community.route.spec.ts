import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { communityRouter } from '../../community.route.js';
import { errorHandler } from '../../../../shared/http/error-handler.js';
import { communityService, MAX_POST_LENGTH, MAX_COMMENT_LENGTH } from '../../community.service.js';
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

  describe('2. Post Content Length Validation Cases', () => {
    it('[COM-IT-VAL-01] POST /api/community/posts với content dài > 5000 ký tự trả về 400', async () => {
      const longContent = 'A'.repeat(MAX_POST_LENGTH + 1);

      const res = await request(app)
        .post('/api/community/posts')
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('vượt quá độ dài tối đa');
    });

    it('[COM-IT-VAL-02] PUT /api/community/posts/:id với content dài > 5000 ký tự trả về 400', async () => {
      const longContent = 'B'.repeat(MAX_POST_LENGTH + 1);

      const res = await request(app)
        .put('/api/community/posts/1')
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('vượt quá độ dài tối đa');
    });

    it('[COM-IT-VAL-03] POST /api/community/posts/:id/comments với content dài > 1000 ký tự trả về 400', async () => {
      const longComment = 'C'.repeat(MAX_COMMENT_LENGTH + 1);

      const res = await request(app)
        .post('/api/community/posts/1/comments')
        .send({ content: longComment });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('vượt quá độ dài tối đa');
    });
  });

  describe('3. SQL Injection Attack Prevention Cases', () => {
    it('[COM-IT-SEC-01] POST /api/community/posts với payload SQL Injection được xử lý an toàn', async () => {
      const sqlPayload = "'; DROP TABLE \"community_post\"; --";
      vi.spyOn(communityService, 'createPost').mockResolvedValue({
        ...mockCommunityPost,
        content: sqlPayload,
      } as any);

      const res = await request(app)
        .post('/api/community/posts')
        .send({ content: sqlPayload });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(sqlPayload);
      expect(communityService.createPost).toHaveBeenCalledWith(1, sqlPayload, undefined, true);
    });

    it('[COM-IT-SEC-02] POST /api/community/posts/:id/comments với payload SQL Injection được xử lý an toàn', async () => {
      const sqlCommentPayload = "1' OR '1'='1' UNION SELECT * FROM user--";
      vi.spyOn(communityService, 'createComment').mockResolvedValue({
        ...mockCommunityComment,
        content: sqlCommentPayload,
      } as any);

      const res = await request(app)
        .post('/api/community/posts/1/comments')
        .send({ content: sqlCommentPayload });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(sqlCommentPayload);
      expect(communityService.createComment).toHaveBeenCalledWith(1, 1, sqlCommentPayload);
    });

    it('[COM-IT-SEC-03] GET /api/community/posts?filter=\' OR 1=1 -- không lỗi SQL và trả về danh sách an toàn', async () => {
      vi.spyOn(communityService, 'getPosts').mockResolvedValue({
        posts: [mockCommunityPost as any],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const res = await request(app).get("/api/community/posts?filter=' OR 1=1 --");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(communityService.getPosts).toHaveBeenCalledWith(1, 1, 10, "' OR 1=1 --");
    });
  });

  describe('4. Bad End Cases', () => {
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

  describe('5. Concurrency & Network Failures', () => {
    it('[COM-IT-CONF-01] Hai request bình luận gửi đồng thời được xử lý an toàn', async () => {
      vi.spyOn(communityService, 'createComment')
        .mockResolvedValueOnce({ ...mockCommunityComment, id: 1, content: 'Comment 1' } as any)
        .mockResolvedValueOnce({ ...mockCommunityComment, id: 2, content: 'Comment 2' } as any);

      const [res1, res2] = await Promise.all([
        request(app).post('/api/community/posts/1/comments').send({ content: 'Comment 1' }),
        request(app).post('/api/community/posts/1/comments').send({ content: 'Comment 2' }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.content).toBe('Comment 1');
      expect(res2.body.data.content).toBe('Comment 2');
    });

    it('[COM-IT-07] Mất kết nối database khi lấy danh sách bài viết trả về 500', async () => {
      vi.spyOn(communityService, 'getPosts').mockRejectedValue(new Error('Connection lost (P1001)'));

      const res = await request(app).get('/api/community/posts');

      expect(res.status).toBe(500);
    });
  });
});
