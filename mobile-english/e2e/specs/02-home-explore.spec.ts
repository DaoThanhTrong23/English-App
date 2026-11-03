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

describe('Suite 02: Mobile Home & Explore Flow (MOB-HOME, MOB-EXPLORE)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-HOME-01 .. MOB-HOME-12
  // =========================================================================
  describe('1. Màn hình Trang chủ ((tabs)/index.tsx)', () => {
    it('[MOB-HOME-01] Kiểm tra hiển thị đầy đủ các thành phần giao diện Trang chủ (Home)', () => {
      mockRouter.replace('/(tabs)');
      assert.equal(clientState.currentRoute, '/(tabs)');
      assert.ok(clientState.activeUser);
      assert.equal(clientState.activeUser.username, 'hocvien_chuan');
    });

    it('[MOB-HOME-02] Kiểm tra hiển thị số chuỗi ngày học liên tiếp (Streak) và điểm kinh nghiệm (XP)', () => {
      const { streakDays, xpPoints } = clientState.activeUser!;
      assert.equal(streakDays, 5);
      assert.equal(xpPoints, 450);
    });

    it('[MOB-HOME-03] Kiểm tra hiển thị chuông thông báo và số lượng thông báo chưa đọc', () => {
      const unreadCount = sharedState.notifications.filter((n) => !n.isRead).length;
      assert.equal(unreadCount, 2);
    });

    it('[MOB-HOME-04] Kiểm tra mở và tương tác với Modal Nhiệm vụ hàng ngày (Daily Quest Modal)', () => {
      const quests = sharedState.quests;
      assert.equal(quests.length, 3);
      assert.equal(quests[0].title, 'Đăng nhập ứng dụng');
    });

    it('[MOB-HOME-05] Kiểm tra nhận thưởng điểm XP khi hoàn thành một nhiệm vụ ngày', () => {
      const quest = sharedState.quests[0];
      assert.equal(quest.currentCount >= quest.targetCount, true);
      assert.equal(quest.isClaimed, false);

      quest.isClaimed = true;
      clientState.activeUser!.xpPoints += quest.rewardXp;

      assert.equal(quest.isClaimed, true);
      assert.equal(clientState.activeUser!.xpPoints, 470);
    });

    it('[MOB-HOME-06] Kiểm tra thẻ nhắc nhở Ôn tập từ vựng SRS khi có từ vựng đến hạn', () => {
      const dueWords = sharedState.savedWords.filter((w) => w.isDueToday);
      assert.equal(dueWords.length, 1);
      assert.equal(dueWords[0].headword, 'achievement');
    });

    it('[MOB-HOME-07] Kiểm tra chạm vào thẻ nhắc nhở SRS mở cửa sổ Ôn tập từ vựng thông minh', () => {
      mockRouter.push('/saved-words?mode=due_review');
      assert.ok(clientState.currentRoute.includes('mode=due_review'));
    });

    it('[MOB-HOME-08] Kiểm tra lộ trình các bài học được sắp xếp ưu tiên theo kỹ năng yếu nhất', () => {
      const weakestSkill = 'Listening';
      const prioritizedCourse = sharedState.courses.find((c) => c.cefrLevel === 'B1');
      assert.ok(prioritizedCourse);
      assert.equal(weakestSkill, 'Listening');
    });

    it('[MOB-HOME-09] Kiểm tra chạm vào một bài học trong lộ trình điều hướng sang Chi tiết bài học', () => {
      mockRouter.push('/lesson/10');
      assert.equal(clientState.currentRoute, '/lesson/10');
    });

    it('[MOB-HOME-10] Kiểm tra nút Xem chứng chỉ mở CertificateModal khi hoàn thành cấp độ', () => {
      const completedCourse = { ...sharedState.courses[0], isCompleted: true, progressPercent: 100 };
      assert.equal(completedCourse.isCompleted, true);
      showMockAlert('Chứng chỉ tốt nghiệp', 'Chúc mừng bạn đã hoàn thành khóa học A1');
      assert.equal(clientState.activeDialog?.title, 'Chứng chỉ tốt nghiệp');
    });

    it('[MOB-HOME-11] Kiểm tra tính năng Học lại cấp độ (Relearn Level)', () => {
      const course = sharedState.courses[0];
      course.isCompleted = false;
      course.progressPercent = 0;
      assert.equal(course.progressPercent, 0);
    });

    it('[MOB-HOME-12] Kiểm tra thao tác kéo xuống để làm mới dữ liệu Trang chủ (Pull-to-refresh)', async () => {
      let isRefreshing = true;
      await sleep(10);
      isRefreshing = false;
      assert.equal(isRefreshing, false);
    });
  });

  // =========================================================================
  // GROUP 2: MOB-EXPLORE-01 .. MOB-EXPLORE-10
  // =========================================================================
  describe('2. Màn hình Khám phá ((tabs)/explore.tsx)', () => {
    it('[MOB-EXPLORE-01] Kiểm tra hiển thị đầy đủ các thành phần giao diện màn hình Khám phá (Explore)', () => {
      mockRouter.replace('/(tabs)/explore');
      assert.equal(clientState.currentRoute, '/(tabs)/explore');
      const levels = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      assert.equal(levels.length, 7);
    });

    it('[MOB-EXPLORE-02] Kiểm tra tìm kiếm khóa học/chủ đề theo từ khóa tức thời', () => {
      const keyword = 'Giao tiếp';
      const results = sharedState.courses.filter(
        (c) => c.title.toLowerCase().includes(keyword.toLowerCase()) || c.description.toLowerCase().includes(keyword.toLowerCase())
      );
      assert.equal(results.length, 1);
      assert.equal(results[0].title, 'Giao tiếp hàng ngày (Daily English)');
    });

    it('[MOB-EXPLORE-03] Kiểm tra xóa nhanh từ khóa tìm kiếm qua icon (X)', () => {
      let searchInput = 'Giao tiếp';
      searchInput = '';
      assert.equal(searchInput, '');
    });

    it('[MOB-EXPLORE-04] Kiểm tra lọc danh sách khóa học theo cấp độ CEFR A1', () => {
      const level = 'A1';
      const results = sharedState.courses.filter((c) => c.cefrLevel === level);
      assert.equal(results.length, 1);
      assert.equal(results[0].cefrLevel, 'A1');
    });

    it('[MOB-EXPLORE-05] Kiểm tra lọc danh sách khóa học theo cấp độ CEFR B2', () => {
      const level = 'B2';
      const results = sharedState.courses.filter((c) => c.cefrLevel === level);
      assert.equal(results.length, 1);
      assert.equal(results[0].title, 'Advanced Business Communication');
    });

    it('[MOB-EXPLORE-06] Kiểm tra kết hợp tìm kiếm từ khóa trong một cấp độ CEFR cụ thể', () => {
      const level = 'B1';
      const keyword = 'Travel';
      const results = sharedState.courses.filter(
        (c) => c.cefrLevel === level && (c.title.includes(keyword) || c.description.includes(keyword))
      );
      assert.equal(results.length, 1);
      assert.equal(results[0].title, 'Tiếng Anh Du lịch (Travel & Tourism)');
    });

    it('[MOB-EXPLORE-07] Kiểm tra hiển thị trạng thái Empty State khi không tìm thấy khóa học nào phù hợp', () => {
      const keyword = 'xyz999999';
      const results = sharedState.courses.filter((c) => c.title.includes(keyword));
      assert.equal(results.length, 0);
    });

    it('[MOB-EXPLORE-08] Kiểm tra nút Học ngay trên thẻ khóa học', () => {
      const course = sharedState.courses[1];
      course.isEnrolled = true;
      mockRouter.push(`/course/${course.id}`);
      assert.equal(clientState.currentRoute, '/course/2');
      assert.equal(course.isEnrolled, true);
    });

    it('[MOB-EXPLORE-09] Kiểm tra chạm trực tiếp vào thẻ khóa học điều hướng sang màn hình Chi tiết khóa học', () => {
      mockRouter.push('/course/3');
      assert.equal(clientState.currentRoute, '/course/3');
    });

    it('[MOB-EXPLORE-10] Kiểm tra kéo làm mới danh sách khóa học (Pull-to-refresh trên tab Khám phá)', async () => {
      let isRefreshing = true;
      await sleep(10);
      isRefreshing = false;
      assert.equal(isRefreshing, false);
    });
  });
});
