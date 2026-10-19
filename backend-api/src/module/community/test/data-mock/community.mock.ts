export const mockCommunityPost = {
  id: 1,
  userId: 1,
  content: "Hôm nay mình đã học xong 50 từ vựng mới!",
  imageUrl: "/uploads/posts/post-1.png",
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: 1,
    username: "john_doe",
    avatarUrl: "/avatars/john.png",
  },
  images: [{ id: 1, imageUrl: "/uploads/posts/post-1.png" }],
  _count: {
    comments: 2,
    postLikes: 5,
  },
  postLikes: [{ id: 10 }],
};

export const mockCommunityComment = {
  id: 1,
  postId: 1,
  userId: 2,
  content: "Tuyệt vời quá bạn ơi, chúc mừng nhé!",
  createdAt: new Date(),
  user: {
    id: 2,
    username: "alice",
    avatarUrl: "/avatars/alice.png",
  },
};
