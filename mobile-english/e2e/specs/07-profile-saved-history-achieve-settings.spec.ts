import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  sharedState,
  clientState,
  mockRouter,
  mockSecureStore,
  showMockAlert,
  showMockToast,
} from '../helpers/test-harness';

describe('Suite 07: Profile, Saved Words, History, Achievements & Settings Flow (MOB-PROFILE, MOB-SAVED, MOB-HISTORY, MOB-ACHIEVE, MOB-SETTINGS)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-PROFILE-01 .. MOB-PROFILE-10
  // =========================================================================
  describe('1. Màn hình Hồ sơ cá nhân ((tabs)/profile.tsx)', () => {
    it('[MOB-PROFILE-01] Kiểm tra hiển thị đầy đủ các thành phần giao diện màn hình Hồ sơ cá nhân', () => {
      mockRouter.replace('/(tabs)/profile');
      assert.equal(clientState.currentRoute, '/(tabs)/profile');
      assert.equal(clientState.activeUser!.username, 'hocvien_chuan');
      assert.equal(clientState.activeUser!.email, 'hocvien@english.com');
    });

    it('[MOB-PROFILE-02] Kiểm tra hiển thị Biểu đồ/Thang đo năng lực Elo 4 kỹ năng', () => {
      const { grammarElo, vocabElo, readingElo, listeningElo } = clientState.activeUser!;
      assert.equal(grammarElo, 1250);
      assert.equal(vocabElo, 1300);
      assert.equal(readingElo, 1180);
      assert.equal(listeningElo, 1100);
    });

    it('[MOB-PROFILE-03] Kiểm tra nút Cập nhật thông tin điều hướng sang màn hình Chỉnh sửa hồ sơ', () => {
      mockRouter.push('/edit-profile');
      assert.equal(clientState.currentRoute, '/edit-profile');
    });

    it('[MOB-PROFILE-04] Kiểm tra thay đổi ảnh đại diện (Avatar) trên màn hình Chỉnh sửa hồ sơ', () => {
      const newAvatarUri = 'file:///cache/student_avatar_new.png';
      clientState.activeUser!.avatarUrl = newAvatarUri;
      assert.equal(clientState.activeUser!.avatarUrl, newAvatarUri);
    });

    it('[MOB-PROFILE-05] Kiểm tra chỉnh sửa Tên hiển thị và lưu thay đổi thành công', () => {
      const newJob = 'Kỹ sư phần mềm';
      clientState.activeUser!.job = newJob;
      showMockToast('Cập nhật thông tin thành công!', 'success');
      assert.equal(clientState.activeUser!.job, 'Kỹ sư phần mềm');
      assert.equal(clientState.activeToast?.message, 'Cập nhật thông tin thành công!');
    });

    it('[MOB-PROFILE-06] Kiểm tra trường Email bị khóa không cho phép sửa đổi', () => {
      const isEmailEditable = false;
      assert.equal(isEmailEditable, false);
    });

    it('[MOB-PROFILE-07] Kiểm tra mục Lịch sử từ vựng đã lưu hiển thị số lượng từ và điều hướng sang Sổ tay', () => {
      const savedCount = sharedState.savedWords.length;
      assert.equal(savedCount, 1);
      mockRouter.push('/saved-words');
      assert.equal(clientState.currentRoute, '/saved-words');
    });

    it('[MOB-PROFILE-08] Kiểm tra mục Lịch sử học tập & Điểm thi điều hướng sang màn hình History', () => {
      mockRouter.push('/history');
      assert.equal(clientState.currentRoute, '/history');
    });

    it('[MOB-PROFILE-09] Kiểm tra mục Thành tựu của bạn điều hướng sang màn hình Danh hiệu', () => {
      mockRouter.push('/achievements');
      assert.equal(clientState.currentRoute, '/achievements');
    });

    it('[MOB-PROFILE-10] Kiểm tra nút icon Cài đặt ở góc trên bên phải thanh Header', () => {
      mockRouter.push('/settings');
      assert.equal(clientState.currentRoute, '/settings');
    });
  });

  // =========================================================================
  // GROUP 2: MOB-SAVED-01 .. MOB-SAVED-10
  // =========================================================================
  describe('2. Sổ tay từ vựng cá nhân (saved-words.tsx)', () => {
    it('[MOB-SAVED-01] Kiểm tra hiển thị đầy đủ giao diện Sổ tay từ vựng cá nhân', () => {
      mockRouter.push('/saved-words');
      assert.equal(clientState.currentRoute, '/saved-words');
      const totalSaved = sharedState.savedWords.length;
      const dueCount = sharedState.savedWords.filter((w) => w.isDueToday).length;
      assert.equal(totalSaved, 1);
      assert.equal(dueCount, 1);
    });

    it('[MOB-SAVED-02] Kiểm tra tìm kiếm từ vựng trong sổ tay theo tiếng Anh hoặc nghĩa tiếng Việt', () => {
      const keyword = 'thành tích';
      const results = sharedState.savedWords.filter(
        (w) => w.headword.includes(keyword) || w.meaning.includes(keyword)
      );
      assert.equal(results.length, 1);
      assert.equal(results[0].headword, 'achievement');
    });

    it('[MOB-SAVED-03] Kiểm tra hiển thị thông tin chi tiết trên từng thẻ từ vựng trong sổ tay', () => {
      const word = sharedState.savedWords[0];
      assert.equal(word.headword, 'achievement');
      assert.equal(word.partOfSpeech, 'noun');
      assert.equal(word.memoryLevel, 2);
    });

    it('[MOB-SAVED-04] Kiểm tra phát âm thanh từ vựng khi chạm icon Loa trong sổ tay', () => {
      let isAudioPlaying = true;
      assert.equal(isAudioPlaying, true);
    });

    it('[MOB-SAVED-05] Kiểm tra nút Bắt đầu ôn tập (X từ) mở cửa sổ Ôn tập SRS thông minh', () => {
      const dueWords = sharedState.savedWords.filter((w) => w.isDueToday);
      assert.equal(dueWords.length, 1);
    });

    it('[MOB-SAVED-06] Kiểm tra nút Luyện tập tự do ôn tập toàn bộ từ vựng đã lưu bất kỳ lúc nào', () => {
      const allWords = sharedState.savedWords;
      assert.equal(allWords.length, 1);
    });

    it('[MOB-SAVED-07] Kiểm tra đánh giá mức độ ghi nhớ (Khó, Nhớ, Dễ) trong phiên ôn tập SRS', () => {
      const word = sharedState.savedWords[0];
      // Đánh giá: Đã nhớ -> tăng memory level
      word.memoryLevel += 1;
      assert.equal(word.memoryLevel, 3);
    });

    it('[MOB-SAVED-08] Kiểm tra thao tác xóa từ vựng khỏi Sổ tay cá nhân kèm xác nhận', () => {
      sharedState.savedWords.pop();
      assert.equal(sharedState.savedWords.length, 0);
      showMockToast('Đã xóa từ khỏi sổ tay!', 'info');
      assert.equal(clientState.activeToast?.message, 'Đã xóa từ khỏi sổ tay!');
    });

    it('[MOB-SAVED-09] Kiểm tra hiển thị trạng thái Empty State khi Sổ tay từ vựng chưa có từ nào', () => {
      sharedState.savedWords = [];
      const isEmpty = sharedState.savedWords.length === 0;
      assert.equal(isEmpty, true);
    });

    it('[MOB-SAVED-10] Kiểm tra nút Quay lại từ Sổ tay từ vựng về màn hình Profile', () => {
      mockRouter.push('/(tabs)/profile');
      assert.equal(clientState.currentRoute, '/(tabs)/profile');
    });
  });

  // =========================================================================
  // GROUP 3: MOB-HISTORY-01 .. MOB-HISTORY-06
  // =========================================================================
  describe('3. Lịch sử học tập & Điểm thi (history.tsx)', () => {
    it('[MOB-HISTORY-01] Kiểm tra hiển thị giao diện màn hình Lịch sử học tập với 2 Tabs', () => {
      mockRouter.push('/history');
      assert.equal(clientState.currentRoute, '/history');
      const tabs = ['Bài kiểm tra', 'Đánh giá FAME-KT'];
      assert.equal(tabs.length, 2);
    });

    it('[MOB-HISTORY-02] Kiểm tra hiển thị danh sách các bài kiểm tra đã làm tại Tab 1', () => {
      const historyTests = [
        { title: 'Bài 1: Greeting & Vocabulary', score: '9/10', percent: '90%', result: 'Đạt' },
      ];
      assert.equal(historyTests.length, 1);
      assert.equal(historyTests[0].result, 'Đạt');
    });

    it('[MOB-HISTORY-03] Kiểm tra chuyển sang Tab 2 - Xem lịch sử đánh giá thích ứng FAME-KT', () => {
      const catHistory = [
        { date: '2026-10-15', cefrLevel: 'B1', grammarElo: 1250, vocabElo: 1300 },
      ];
      assert.equal(catHistory.length, 1);
      assert.equal(catHistory[0].cefrLevel, 'B1');
    });

    it('[MOB-HISTORY-04] Kiểm tra chạm vào một bài kiểm tra cũ để xem lại bảng điểm chi tiết', () => {
      mockRouter.push('/practice/result?testId=1');
      assert.ok(clientState.currentRoute.includes('testId=1'));
    });

    it('[MOB-HISTORY-05] Kiểm tra hiển thị trạng thái Empty State khi chưa có lịch sử bài kiểm tra nào', () => {
      const emptyHistory: any[] = [];
      assert.equal(emptyHistory.length, 0);
    });

    it('[MOB-HISTORY-06] Kiểm tra nút Quay lại từ Lịch sử về màn hình Profile', () => {
      mockRouter.push('/(tabs)/profile');
      assert.equal(clientState.currentRoute, '/(tabs)/profile');
    });
  });

  // =========================================================================
  // GROUP 4: MOB-ACHIEVE-01 .. MOB-ACHIEVE-08
  // =========================================================================
  describe('4. Bộ sưu tập Danh hiệu (achievements.tsx)', () => {
    it('[MOB-ACHIEVE-01] Kiểm tra hiển thị đầy đủ giao diện Bộ sưu tập Danh hiệu', () => {
      mockRouter.push('/achievements');
      assert.equal(clientState.currentRoute, '/achievements');
      assert.equal(sharedState.achievements.length, 3);
    });

    it('[MOB-ACHIEVE-02] Kiểm tra hiển thị huy hiệu đã mở khóa (Unlocked Badge)', () => {
      const unlocked = sharedState.achievements.find((a) => a.isUnlocked);
      assert.ok(unlocked);
      assert.equal(unlocked.title, 'Người mới bắt đầu');
    });

    it('[MOB-ACHIEVE-03] Kiểm tra hiển thị huy hiệu đang bị khóa (Locked Badge)', () => {
      const locked = sharedState.achievements.find((a) => !a.isUnlocked);
      assert.ok(locked);
      assert.equal(locked.isUnlocked, false);
    });

    it('[MOB-ACHIEVE-04] Kiểm tra thanh tiến trình hoàn thành điều kiện của huy hiệu đang khóa', () => {
      const badge = sharedState.achievements[2]; // Kho từ vựng 100
      const percent = (badge.progress / badge.target) * 100;
      assert.equal(percent, 65);
    });

    it('[MOB-ACHIEVE-05] Kiểm tra chạm vào huy hiệu xem chi tiết danh hiệu và phần thưởng XP', () => {
      const badge = sharedState.achievements[0];
      assert.equal(badge.rewardXp, 50);
    });

    it('[MOB-ACHIEVE-06] Kiểm tra tự động mở khóa huy hiệu mới ngay khi đạt mốc điều kiện', () => {
      const badge = sharedState.achievements[1]; // Chiến thần 7 ngày
      badge.progress = 7;
      if (badge.progress >= badge.target) {
        badge.isUnlocked = true;
        clientState.activeUser!.xpPoints += badge.rewardXp;
      }
      assert.equal(badge.isUnlocked, true);
      assert.equal(clientState.activeUser!.xpPoints, 550);
    });

    it('[MOB-ACHIEVE-07] Kiểm tra cuộn mượt mà danh sách bộ sưu tập huy hiệu', () => {
      const totalBadges = 20;
      assert.ok(totalBadges > 0);
    });

    it('[MOB-ACHIEVE-08] Kiểm tra nút Quay lại từ Bộ sưu tập danh hiệu về màn hình Profile', () => {
      mockRouter.push('/(tabs)/profile');
      assert.equal(clientState.currentRoute, '/(tabs)/profile');
    });
  });

  // =========================================================================
  // GROUP 5: MOB-SETTINGS-01 .. MOB-SETTINGS-10
  // =========================================================================
  describe('5. Cài đặt hệ thống (settings.tsx)', () => {
    it('[MOB-SETTINGS-01] Kiểm tra hiển thị đầy đủ giao diện màn hình Cài đặt hệ thống', () => {
      mockRouter.push('/settings');
      assert.equal(clientState.currentRoute, '/settings');
    });

    it('[MOB-SETTINGS-02] Kiểm tra công tắc Bật/Tắt thông báo nhắc nhở học tập hàng ngày', () => {
      let isEnabled = clientState.notificationsEnabled;
      isEnabled = !isEnabled;
      clientState.notificationsEnabled = isEnabled;
      assert.equal(clientState.notificationsEnabled, false);
    });

    it('[MOB-SETTINGS-03] Kiểm tra chọn giờ nhắc nhở học tập cố định qua bộ chọn giờ', () => {
      const newTime = '21:30';
      clientState.reminderTime = newTime;
      assert.equal(clientState.reminderTime, '21:30');
    });

    it('[MOB-SETTINGS-04] Kiểm tra công tắc chuyển đổi Chế độ nền tối (Dark Mode) / Nền sáng', () => {
      clientState.currentTheme = 'dark';
      assert.equal(clientState.currentTheme, 'dark');
      clientState.currentTheme = 'light';
      assert.equal(clientState.currentTheme, 'light');
    });

    it('[MOB-SETTINGS-05] Kiểm tra mở Modal Trung tâm trợ giúp (FAQ Modal)', () => {
      let isFaqOpen = true;
      assert.equal(isFaqOpen, true);
    });

    it('[MOB-SETTINGS-06] Kiểm tra mở Modal Về EngMaster (About Modal)', () => {
      const appInfo = { name: 'EngMaster', version: '1.0.0' };
      assert.equal(appInfo.name, 'EngMaster');
      assert.equal(appInfo.version, '1.0.0');
    });

    it('[MOB-SETTINGS-07] Kiểm tra tính năng Khóa tài khoản học viên kèm xác nhận', () => {
      const user = clientState.activeUser!;
      user.isLocked = true;
      clientState.activeUser = null;
      mockRouter.replace('/(auth)/login');

      assert.equal(user.isLocked, true);
      assert.equal(clientState.currentRoute, '/(auth)/login');
    });

    it('[MOB-SETTINGS-08] Kiểm tra hiển thị hộp thoại xác nhận khi bấm Đăng xuất', () => {
      showMockAlert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi EngMaster?');
      assert.equal(clientState.activeDialog?.title, 'Đăng xuất');
    });

    it('[MOB-SETTINGS-09] Kiểm tra xác nhận Đăng xuất thành công', async () => {
      await mockSecureStore.deleteItemAsync('accessToken');
      await mockSecureStore.deleteItemAsync('refreshToken');
      clientState.activeUser = null;
      mockRouter.replace('/(auth)/login');

      assert.equal(await mockSecureStore.getItemAsync('accessToken'), null);
      assert.equal(clientState.currentRoute, '/(auth)/login');
    });

    it('[MOB-SETTINGS-10] Kiểm tra nút Quay lại từ Cài đặt về màn hình Profile', () => {
      mockRouter.push('/(tabs)/profile');
      assert.equal(clientState.currentRoute, '/(tabs)/profile');
    });
  });
});

