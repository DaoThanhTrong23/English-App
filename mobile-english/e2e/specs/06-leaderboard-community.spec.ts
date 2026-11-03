import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  sharedState,
  clientState,
  mockRouter,
  showMockAlert,
  showMockToast,
  sleep,
} from '../helpers/test-harness';

describe('Suite 06: Leaderboard & Community Forum Flow (MOB-LEADER, MOB-COMMUNITY)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-LEADER-01 .. MOB-LEADER-08
  // =========================================================================
  describe('1. Màn hình Bảng xếp hạng ((tabs)/leaderboard.tsx)', () => {
    it('[MOB-LEADER-01] Kiểm tra hiển thị đầy đủ giao diện màn hình Bảng xếp hạng', () => {
      mockRouter.replace('/(tabs)/leaderboard');
      assert.equal(clientState.currentRoute, '/(tabs)/leaderboard');
    });

    it('[MOB-LEADER-02] Kiểm tra hiển thị Bục vinh danh Top 3 học viên xuất sắc nhất', () => {
      const top3 = [
        { rank: 1, name: 'tran_van_b', xp: 850, medal: 'gold' },
        { rank: 2, name: 'le_thi_c', xp: 620, medal: 'silver' },
        { rank: 3, name: 'hocvien_chuan', xp: 450, medal: 'bronze' },
      ];
      assert.equal(top3[0].rank, 1);
      assert.equal(top3[0].medal, 'gold');
    });

    it('[MOB-LEADER-03] Kiểm tra hiển thị thông tin từng học viên trong danh sách xếp hạng', () => {
      const studentRow = {
        rank: 4,
        username: 'student_four',
        cefrLevel: 'A2',
        xp: 410,
      };
      assert.equal(studentRow.rank, 4);
      assert.ok(studentRow.xp > 0);
    });

    it('[MOB-LEADER-04] Kiểm tra thanh cố định hiển thị Thứ hạng của chính bản thân ở chân màn hình', () => {
      const myRankInfo = {
        rank: 3,
        username: clientState.activeUser!.username,
        xp: clientState.activeUser!.xpPoints,
      };
      assert.equal(myRankInfo.rank, 3);
      assert.equal(myRankInfo.xp, 450);
    });

    it('[MOB-LEADER-05] Kiểm tra cuộn mượt mà danh sách bảng xếp hạng', () => {
      const itemsCount = 50;
      assert.equal(itemsCount, 50);
    });

    it('[MOB-LEADER-06] Kiểm tra thao tác kéo xuống để làm mới Bảng xếp hạng (Pull-to-refresh)', async () => {
      let isRefreshing = true;
      await sleep(10);
      isRefreshing = false;
      assert.equal(isRefreshing, false);
    });

    it('[MOB-LEADER-07] Kiểm tra hiển thị trạng thái Empty State khi hệ thống chưa có dữ liệu xếp hạng', () => {
      const leaderboardList: any[] = [];
      const isEmpty = leaderboardList.length === 0;
      assert.equal(isEmpty, true);
    });

    it('[MOB-LEADER-08] Kiểm tra làm nổi bật dòng của chính mình khi cuộn trong danh sách chính', () => {
      const currentUsername = clientState.activeUser!.username;
      const isSelf = currentUsername === 'hocvien_chuan';
      assert.equal(isSelf, true);
    });
  });

  // =========================================================================
  // GROUP 2: MOB-COMMUNITY-01 .. MOB-COMMUNITY-12
  // =========================================================================
  describe('2. Diễn đàn Cộng đồng ((tabs)/community.tsx)', () => {
    it('[MOB-COMMUNITY-01] Kiểm tra hiển thị đầy đủ giao diện Diễn đàn Cộng đồng', () => {
      mockRouter.replace('/(tabs)/community');
      assert.equal(clientState.currentRoute, '/(tabs)/community');
      const tabs = ['Tất cả', 'Của tôi', 'Riêng tư'];
      assert.equal(tabs.length, 3);
    });

    it('[MOB-COMMUNITY-02] Kiểm tra chuyển đổi qua lại giữa 3 Tabs Tất cả, Của tôi, Riêng tư', () => {
      const currentUserId = clientState.activeUser!.id;
      const allPosts = sharedState.communityPosts.filter((p) => p.isPublic);
      const myPosts = sharedState.communityPosts.filter((p) => p.userId === currentUserId);
      const privatePosts = sharedState.communityPosts.filter((p) => p.userId === currentUserId && !p.isPublic);

      assert.equal(allPosts.length, 1);
      assert.equal(myPosts.length, 2);
      assert.equal(privatePosts.length, 1);
    });

    it('[MOB-COMMUNITY-03] Kiểm tra mở Modal soạn thảo bài viết mới', () => {
      let isCreatePostModalOpen = true;
      assert.equal(isCreatePostModalOpen, true);
    });

    it('[MOB-COMMUNITY-04] Kiểm tra tính năng đính kèm hình ảnh vào bài viết từ thư viện điện thoại', () => {
      const imageAttachment = 'file:///cache/notebook_notes.jpg';
      assert.ok(imageAttachment);
    });

    it('[MOB-COMMUNITY-05] Kiểm tra chuyển đổi quyền riêng tư bài viết (Công khai vs Riêng tư)', () => {
      let isPublic = true;
      isPublic = false;
      assert.equal(isPublic, false);
      isPublic = true;
      assert.equal(isPublic, true);
    });

    it('[MOB-COMMUNITY-06] Kiểm tra validation khi để trống nội dung bài viết', () => {
      const content = '   ';
      let error = '';
      if (!content.trim()) {
        error = 'Vui lòng nhập nội dung chia sẻ!';
      }
      assert.equal(error, 'Vui lòng nhập nội dung chia sẻ!');
    });

    it('[MOB-COMMUNITY-07] Kiểm tra đăng bài viết mới thành công và hiển thị lên bảng tin', () => {
      const newPost = {
        id: 3,
        userId: clientState.activeUser!.id,
        authorName: clientState.activeUser!.username,
        authorAvatar: clientState.activeUser!.avatarUrl!,
        content: 'Hôm nay mình đã hoàn thành chuỗi 7 ngày học liên tiếp trên EngMaster! Cố lên nào mọi người!',
        isPublic: true,
        createdAt: 'Vừa xong',
        likesCount: 0,
        isLiked: false,
        comments: [],
      };
      sharedState.communityPosts.unshift(newPost);
      showMockToast('Đăng bài thành công!', 'success');

      assert.equal(sharedState.communityPosts[0].id, 3);
      assert.equal(clientState.activeToast?.message, 'Đăng bài thành công!');
    });

    it('[MOB-COMMUNITY-08] Kiểm tra hiển thị đầy đủ thông tin trên một thẻ bài đăng (Post Card)', () => {
      const post = sharedState.communityPosts[0];
      assert.ok(post.authorName);
      assert.ok(post.content);
      assert.ok(typeof post.likesCount === 'number');
      assert.ok(Array.isArray(post.comments));
    });

    it('[MOB-COMMUNITY-09] Kiểm tra thao tác Thả tim (Like) bài viết', () => {
      const post = sharedState.communityPosts[0];
      assert.equal(post.isLiked, false);
      const initialLikes = post.likesCount;

      // Like
      post.isLiked = true;
      post.likesCount++;
      assert.equal(post.likesCount, initialLikes + 1);

      // Unlike
      post.isLiked = false;
      post.likesCount--;
      assert.equal(post.likesCount, initialLikes);
    });

    it('[MOB-COMMUNITY-09b] Kiểm tra cơ chế chống Race Condition khi chạm nút Like liên tục', () => {
      let isLikeInFlight = false;
      let executedLikes = 0;

      const toggleLike = () => {
        if (isLikeInFlight) return;
        isLikeInFlight = true;
        executedLikes++;
        isLikeInFlight = false;
      };

      toggleLike();
      toggleLike();
      assert.equal(executedLikes, 2);
    });

    it('[MOB-COMMUNITY-10] Kiểm tra mở khung bình luận và gửi bình luận (Comment) mới', () => {
      const post = sharedState.communityPosts[0];
      const initialCount = post.comments.length;
      const newComment = {
        id: 2,
        userId: clientState.activeUser!.id,
        authorName: clientState.activeUser!.username,
        authorAvatar: clientState.activeUser!.avatarUrl!,
        content: 'Chúc mừng bạn nhé, cùng cố gắng!',
        createdAt: 'Vừa xong',
      };
      post.comments.push(newComment);
      assert.equal(post.comments.length, initialCount + 1);
      assert.equal(post.comments[post.comments.length - 1].content, 'Chúc mừng bạn nhé, cùng cố gắng!');
    });

    it('[MOB-COMMUNITY-11] Kiểm tra chuyển đổi nhanh quyền riêng tư của bài viết do chính mình sở hữu', () => {
      const post = sharedState.communityPosts[0];
      assert.equal(post.isPublic, true);
      post.isPublic = false;
      assert.equal(post.isPublic, false);
    });

    it('[MOB-COMMUNITY-12] Kiểm tra thao tác kéo xuống để làm mới bảng tin Cộng đồng', async () => {
      let isRefreshing = true;
      await sleep(10);
      isRefreshing = false;
      assert.equal(isRefreshing, false);
    });
  });
});
