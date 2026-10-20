import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityService, MAX_POST_LENGTH, MAX_COMMENT_LENGTH } from '../../community.service.js';
import { mockCommunityPost, mockCommunityComment } from '../data-mock/community.mock.js';
import { prisma } from '../../../../config/prisma.js';
import { activityLogRepository } from '../../../activity-log/activity-log.repository.js';

vi.mock('../../../../config/prisma.js', () => ({
  prisma: {
    communityPost: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    postLike: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    communityComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    postImage: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../../activity-log/activity-log.repository.js', () => ({
  activityLogRepository: {
    createLog: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('CommunityService - Unit Tests (QC 10-Year Standard)', () => {
  let service: CommunityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CommunityService();
  });

  describe('1. Happy Cases', () => {
    it('[COM-01a] Lấy danh sách bài viết có phân trang và trạng thái like', async () => {
      (prisma.communityPost.findMany as any).mockResolvedValue([mockCommunityPost]);
      (prisma.communityPost.count as any).mockResolvedValue(1);

      const res = await service.getPosts(1, 1, 10);

      expect(res.posts).toHaveLength(1);
      expect(res.posts[0].hasLiked).toBe(true);
      expect(res.posts[0].likesCount).toBe(5);
      expect(res.pagination.total).toBe(1);
    });

    it('[COM-01b] Đăng bài viết mới thành công', async () => {
      (prisma.communityPost.create as any).mockResolvedValue(mockCommunityPost);

      const res = await service.createPost(1, 'Học xong bài mới', '/image.png', true);

      expect(res.id).toBe(1);
      expect(res.hasLiked).toBe(false);
      expect(prisma.communityPost.create).toHaveBeenCalled();
    });

    it('[COM-01c] Toggle like (thích bài viết chưa like)', async () => {
      (prisma.postLike.findUnique as any).mockResolvedValue(null);
      (prisma.postLike.create as any).mockResolvedValue({ id: 1 });

      const res = await service.toggleLike(1, 1);

      expect(res.hasLiked).toBe(true);
      expect(prisma.postLike.create).toHaveBeenCalled();
    });

    it('[COM-01d] Toggle like (bỏ thích bài viết đã like)', async () => {
      (prisma.postLike.findUnique as any).mockResolvedValue({ id: 10 });
      (prisma.postLike.delete as any).mockResolvedValue({ id: 10 });

      const res = await service.toggleLike(1, 1);

      expect(res.hasLiked).toBe(false);
      expect(prisma.postLike.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });

    it('[COM-01e] Viết bình luận vào bài viết thành công', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue(mockCommunityPost);
      (prisma.communityComment.create as any).mockResolvedValue(mockCommunityComment);

      const res = await service.createComment(2, 1, 'Bình luận hay');

      expect(res.content).toBe(mockCommunityComment.content);
      expect(prisma.communityComment.create).toHaveBeenCalled();
    });
  });

  describe('2. Post Content Length Validation Cases', () => {
    it('[COM-VAL-01] Chặn đăng bài viết khi nội dung vượt quá 5000 ký tự', async () => {
      const longContent = 'A'.repeat(MAX_POST_LENGTH + 1);

      await expect(service.createPost(1, longContent)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'content_too_long' })
      );
    });

    it('[COM-VAL-02] Cho phép đăng bài viết với nội dung độ dài tối đa biên chuẩn (5000 ký tự)', async () => {
      const boundaryContent = 'A'.repeat(MAX_POST_LENGTH);
      (prisma.communityPost.create as any).mockResolvedValue({ ...mockCommunityPost, content: boundaryContent });

      const res = await service.createPost(1, boundaryContent);

      expect(res.content).toHaveLength(MAX_POST_LENGTH);
      expect(prisma.communityPost.create).toHaveBeenCalled();
    });

    it('[COM-VAL-03] Chặn cập nhật bài viết khi nội dung vượt quá 5000 ký tự', async () => {
      const longContent = 'B'.repeat(MAX_POST_LENGTH + 1);

      await expect(
        service.updatePost(1, 1, { content: longContent })
      ).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'content_too_long' })
      );
    });

    it('[COM-VAL-04] Chặn tạo bình luận khi nội dung vượt quá 1000 ký tự', async () => {
      const longComment = 'C'.repeat(MAX_COMMENT_LENGTH + 1);

      await expect(service.createComment(1, 1, longComment)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 400, code: 'content_too_long' })
      );
    });
  });

  describe('3. SQL Injection Attack Prevention Cases', () => {
    it('[COM-SEC-01] Chống SQL Injection khi đăng bài viết chứa payload phá bảng (DROP TABLE)', async () => {
      const sqlInjectionPayload = "'; DROP TABLE \"community_post\"; --";
      (prisma.communityPost.create as any).mockResolvedValue({ ...mockCommunityPost, content: sqlInjectionPayload });

      const res = await service.createPost(1, sqlInjectionPayload);

      expect(res.content).toBe(sqlInjectionPayload);
      expect(prisma.communityPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: sqlInjectionPayload }),
        })
      );
    });

    it('[COM-SEC-02] Chống SQL Injection boolean-based khi tạo bài viết (\' OR \'1\'=\'1)', async () => {
      const booleanSqlPayload = "Test content' OR '1'='1";
      (prisma.communityPost.create as any).mockResolvedValue({ ...mockCommunityPost, content: booleanSqlPayload });

      const res = await service.createPost(1, booleanSqlPayload);

      expect(res.content).toBe(booleanSqlPayload);
      expect(prisma.communityPost.create).toHaveBeenCalled();
    });

    it('[COM-SEC-03] Chống SQL Injection khi bình luận chứa vector Union-based', async () => {
      const unionSqlPayload = "1' UNION SELECT id, username, password_hash FROM \"User\"--";
      (prisma.communityPost.findUnique as any).mockResolvedValue(mockCommunityPost);
      (prisma.communityComment.create as any).mockResolvedValue({ ...mockCommunityComment, content: unionSqlPayload });

      const res = await service.createComment(1, 1, unionSqlPayload);

      expect(res.content).toBe(unionSqlPayload);
      expect(prisma.communityComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: unionSqlPayload }),
        })
      );
    });

    it('[COM-SEC-04] Chống SQL Injection qua query filter (?filter=\' OR 1=1--) an toàn không lộ bài private', async () => {
      (prisma.communityPost.findMany as any).mockResolvedValue([mockCommunityPost]);
      (prisma.communityPost.count as any).mockResolvedValue(1);

      const res = await service.getPosts(1, 1, 10, "' OR 1=1--");

      expect(res.posts).toHaveLength(1);
      expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ isPublic: true }, { userId: 1 }],
          },
        })
      );
    });
  });

  describe('4. Activity Logging Tests', () => {
    it('[COM-LOG-01] Ghi activity log thành công khi tạo bài viết (USER_CREATE_COMMUNITY_POST_SUCCESS)', async () => {
      (prisma.communityPost.create as any).mockResolvedValue(mockCommunityPost);

      await service.createPost(1, 'Học bài chăm chỉ');
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_CREATE_COMMUNITY_POST_SUCCESS',
        })
      );
    });

    it('[COM-LOG-02] Ghi activity log thất bại khi đăng bài viết quá dài (USER_CREATE_COMMUNITY_POST_FAILED)', async () => {
      const longContent = 'X'.repeat(MAX_POST_LENGTH + 10);

      await expect(service.createPost(1, longContent)).rejects.toThrow();
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_CREATE_COMMUNITY_POST_FAILED',
        })
      );
    });

    it('[COM-LOG-03] Ghi activity log thành công khi toggle like bài viết (USER_LIKE_COMMUNITY_POST_SUCCESS)', async () => {
      (prisma.postLike.findUnique as any).mockResolvedValue(null);
      (prisma.postLike.create as any).mockResolvedValue({ id: 1 });

      await service.toggleLike(1, 1);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_LIKE_COMMUNITY_POST_SUCCESS',
        })
      );
    });

    it('[COM-LOG-04] Ghi activity log thành công khi xóa bài viết (USER_DELETE_COMMUNITY_POST_SUCCESS)', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue(mockCommunityPost);
      (prisma.communityPost.delete as any).mockResolvedValue(mockCommunityPost);

      await service.deletePost(1, 1);
      await new Promise((r) => setTimeout(r, 10));

      expect(activityLogRepository.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          actionType: 'USER_DELETE_COMMUNITY_POST_SUCCESS',
        })
      );
    });
  });

  describe('5. Bad End Cases', () => {
    it('[COM-02a] Bình luận vào bài viết không tồn tại ném lỗi 404', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue(null);

      await expect(service.createComment(1, 999, 'Nội dung')).rejects.toThrowError(
        expect.objectContaining({ statuscode: 404, code: 'not_found' })
      );
    });

    it('[COM-02b] Chỉnh sửa bài viết của người khác ném lỗi 403', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue({ ...mockCommunityPost, userId: 99 });

      await expect(
        service.updatePost(1, 1, { content: 'Hack content' })
      ).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403, code: 'forbidden' })
      );
    });

    it('[COM-02c] Xóa bài viết của người khác ném lỗi 403', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue({ ...mockCommunityPost, userId: 99 });

      await expect(service.deletePost(1, 1)).rejects.toThrowError(
        expect.objectContaining({ statuscode: 403, code: 'forbidden' })
      );
    });
  });

  describe('6. Concurrency & Network Failures', () => {
    it('[COM-03] Hai request toggle like đồng thời xử lý nhất quán', async () => {
      (prisma.postLike.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 10 });
      (prisma.postLike.create as any).mockResolvedValue({ id: 10 });
      (prisma.postLike.delete as any).mockResolvedValue({ id: 10 });

      const [res1, res2] = await Promise.all([
        service.toggleLike(1, 1),
        service.toggleLike(1, 1),
      ]);

      expect(res1.hasLiked).toBe(true);
      expect(res2.hasLiked).toBe(false);
    });

    it('[COM-CONF-01] Hai người dùng bình luận vào cùng bài viết đồng thời', async () => {
      (prisma.communityPost.findUnique as any).mockResolvedValue(mockCommunityPost);
      (prisma.communityComment.create as any)
        .mockResolvedValueOnce({ ...mockCommunityComment, id: 1, content: 'Comment 1' })
        .mockResolvedValueOnce({ ...mockCommunityComment, id: 2, content: 'Comment 2' });

      const [c1, c2] = await Promise.all([
        service.createComment(1, 1, 'Comment 1'),
        service.createComment(2, 1, 'Comment 2'),
      ]);

      expect(c1.content).toBe('Comment 1');
      expect(c2.content).toBe('Comment 2');
      expect(prisma.communityComment.create).toHaveBeenCalledTimes(2);
    });

    it('[COM-05] Mất kết nối DB khi lấy danh sách posts ném lỗi', async () => {
      (prisma.communityPost.findMany as any).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getPosts(1, 1, 10)).rejects.toThrow('Connection lost');
    });
  });
});
