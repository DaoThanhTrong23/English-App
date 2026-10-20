import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/http/api-error.js';
import { logExecution } from '../../shared/decorators/log.decorator.js';
import { recordActivity } from '../../shared/decorators/activity.decorator.js';

export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 1000;

export class CommunityService {
  @logExecution()
  async getPosts(userId: number, page: number = 1, limit: number = 10, filter?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Math.min(50, Number(limit) || 10));
    const skip = (pageNum - 1) * take;

    let whereCondition: any = {
      OR: [
        { isPublic: true },
        { userId: userId }
      ]
    };

    if (filter === 'my') {
      whereCondition = { userId: userId };
    } else if (filter === 'private') {
      whereCondition = { userId: userId, isPublic: false };
    } else if (filter === 'public') {
      whereCondition = { isPublic: true };
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true }
          },
          images: {
            select: { id: true, imageUrl: true }
          },
          _count: {
            select: { comments: true, postLikes: true }
          },
          postLikes: {
            where: { userId },
            select: { id: true }
          }
        }
      }),
      prisma.communityPost.count({ where: whereCondition })
    ]);

    const mappedPosts = posts.map(p => ({
      ...p,
      hasLiked: p.postLikes.length > 0,
      likesCount: p._count.postLikes,
      commentsCount: p._count.comments,
      postLikes: undefined,
      _count: undefined
    }));

    return {
      posts: mappedPosts,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasMore: skip + mappedPosts.length < total
      }
    };
  }

  @logExecution()
  @recordActivity("USER_CREATE_COMMUNITY_POST", (_res, userId) => `Người dùng ${userId} đăng bài viết mới`)
  async createPost(userId: number, content: string, imageUrl?: string, isPublic: boolean = true) {
    if (content && content.length > MAX_POST_LENGTH) {
      throw new ApiError(400, "content_too_long", `Nội dung bài viết vượt quá độ dài tối đa ${MAX_POST_LENGTH} ký tự`);
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        content,
        imageUrl,
        isPublic,
        images: imageUrl ? {
          create: [{ imageUrl }]
        } : undefined
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        images: { select: { id: true, imageUrl: true } }
      }
    });
    return { ...post, hasLiked: false, likesCount: 0, commentsCount: 0 };
  }

  @logExecution()
  @recordActivity("USER_LIKE_COMMUNITY_POST", (res, userId, postId) => `Người dùng ${userId} ${res.hasLiked ? 'thích' : 'bỏ thích'} bài viết ${postId}`)
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

  @logExecution()
  async getComments(postId: number) {
    return prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
  }

  @logExecution()
  @recordActivity("USER_COMMENT_COMMUNITY_POST", (_res, userId, postId) => `Người dùng ${userId} bình luận vào bài viết ${postId}`)
  async createComment(userId: number, postId: number, content: string) {
    if (content && content.length > MAX_COMMENT_LENGTH) {
      throw new ApiError(400, "content_too_long", `Nội dung bình luận vượt quá độ dài tối đa ${MAX_COMMENT_LENGTH} ký tự`);
    }

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "not_found", "Không tìm thấy bài viết");

    return prisma.communityComment.create({
      data: { userId, postId, content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });
  }

  @logExecution()
  @recordActivity("USER_UPDATE_COMMUNITY_POST", (_res, userId, postId) => `Người dùng ${userId} chỉnh sửa bài viết ${postId}`)
  async updatePost(
    userId: number,
    postId: number,
    data: { content?: string; isPublic?: boolean; imageUrl?: string | null }
  ) {
    if (data.content && data.content.length > MAX_POST_LENGTH) {
      throw new ApiError(400, "content_too_long", `Nội dung bài viết vượt quá độ dài tối đa ${MAX_POST_LENGTH} ký tự`);
    }

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: { images: true }
    });
    if (!post) throw new ApiError(404, "not_found", "Không tìm thấy bài viết");
    if (post.userId !== userId) throw new ApiError(403, "forbidden", "Bạn không có quyền chỉnh sửa bài viết này");

    const updateFields: any = {};
    if (data.content !== undefined) updateFields.content = data.content;
    if (data.isPublic !== undefined) updateFields.isPublic = data.isPublic;
    if (data.imageUrl !== undefined) {
      updateFields.imageUrl = data.imageUrl;
      // Cập nhật quan hệ images
      await prisma.postImage.deleteMany({ where: { postId } });
      if (data.imageUrl) {
        await prisma.postImage.create({
          data: { postId, imageUrl: data.imageUrl }
        });
      }
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: updateFields,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        images: { select: { id: true, imageUrl: true } },
        _count: { select: { comments: true, postLikes: true } },
        postLikes: { where: { userId }, select: { id: true } }
      }
    });

    return {
      ...updated,
      hasLiked: updated.postLikes.length > 0,
      likesCount: updated._count.postLikes,
      commentsCount: updated._count.comments,
      postLikes: undefined,
      _count: undefined
    };
  }

  @logExecution()
  async updatePostPrivacy(userId: number, postId: number, isPublic: boolean) {
    return this.updatePost(userId, postId, { isPublic });
  }

  @logExecution()
  @recordActivity("USER_DELETE_COMMUNITY_POST", (_res, userId, postId) => `Người dùng ${userId} xóa bài viết ${postId}`)
  async deletePost(userId: number, postId: number) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "not_found", "Không tìm thấy bài viết");
    if (post.userId !== userId) throw new ApiError(403, "forbidden", "Bạn không có quyền xóa bài viết này");

    await prisma.communityPost.delete({ where: { id: postId } });
    return { success: true, message: "Đã xóa bài viết thành công" };
  }
}

export const communityService = new CommunityService();

