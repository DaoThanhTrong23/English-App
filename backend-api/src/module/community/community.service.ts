import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/http/api-error.js';

export class CommunityService {
  async getPosts(userId: number, limit: number = 20) {
    const posts = await prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        },
        _count: {
          select: { comments: true, postLikes: true }
        },
        postLikes: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    return posts.map(p => ({
      ...p,
      hasLiked: p.postLikes.length > 0,
      likesCount: p._count.postLikes,
      commentsCount: p._count.comments,
      postLikes: undefined,
      _count: undefined
    }));
  }

  async createPost(userId: number, content: string) {
    const post = await prisma.communityPost.create({
      data: { userId, content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
    return { ...post, hasLiked: false, likesCount: 0, commentsCount: 0 };
  }

  async toggleLike(userId: number, postId: number) {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      return { hasLiked: false };
    } else {
      await prisma.postLike.create({ data: { postId, userId } });
      return { hasLiked: true };
    }
  }

  async getComments(postId: number) {
    return prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
  }

  async createComment(userId: number, postId: number, content: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "not_found", "Không tìm thấy bài viết");

    return prisma.communityComment.create({
      data: { userId, postId, content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
  }
}

export const communityService = new CommunityService();
