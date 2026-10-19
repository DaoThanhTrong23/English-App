import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunityService } from '../../community.service.js';
import { mockCommunityPost, mockCommunityComment } from '../data-mock/community.mock.js';
import { prisma } from '../../../../config/prisma.js';

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

  describe('2. Bad End Cases', () => {
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

  describe('3. Concurrency & Network Failures', () => {
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

    it('[COM-05] Mất kết nối DB khi lấy danh sách posts ném lỗi', async () => {
      (prisma.communityPost.findMany as any).mockRejectedValue(new Error('Connection lost (P1001)'));

      await expect(service.getPosts(1, 1, 10)).rejects.toThrow('Connection lost');
    });
  });
});
