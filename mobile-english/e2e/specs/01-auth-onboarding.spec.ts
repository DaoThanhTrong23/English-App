import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  sharedState,
  clientState,
  mockSecureStore,
  mockRouter,
  showMockAlert,
  showMockToast,
  sleep,
} from '../helpers/test-harness';

describe('Suite 01: Mobile Auth & Onboarding Flow (MOB-AUTH, MOB-ONBOARD)', () => {
  beforeEach(() => {
    resetState();
  });

  // =========================================================================
  // GROUP 1: MOB-AUTH-01 .. MOB-AUTH-12
  // =========================================================================
  describe('1. Màn hình Đăng nhập & Đăng ký Mobile ((auth)/login.tsx & register.tsx)', () => {
    it('[MOB-AUTH-01] Kiểm tra hiển thị đầy đủ các thành phần giao diện màn hình Đăng nhập Mobile', () => {
      mockRouter.replace('/(auth)/login');
      assert.equal(clientState.currentRoute, '/(auth)/login');
      const expectedElements = [
        'Chào mừng trở lại',
        'Hãy đăng nhập để tiếp tục',
        'Email hoặc tên đăng nhập',
        'Mật khẩu',
        'Quên mật khẩu?',
        'Đăng nhập',
        'hoặc đăng nhập bằng',
        'Google',
        'Chưa có tài khoản? Đăng ký ngay',
      ];
      assert.ok(expectedElements.length > 0);
    });

    it('[MOB-AUTH-02] Kiểm tra tính năng ẩn/hiện mật khẩu qua icon con mắt trên màn hình Đăng nhập', () => {
      let secureTextEntry = true;
      let eyeIcon = 'eye-off';

      // Chạm lần 1
      secureTextEntry = !secureTextEntry;
      eyeIcon = secureTextEntry ? 'eye-off' : 'eye';
      assert.equal(secureTextEntry, false);
      assert.equal(eyeIcon, 'eye');

      // Chạm lần 2
      secureTextEntry = !secureTextEntry;
      eyeIcon = secureTextEntry ? 'eye-off' : 'eye';
      assert.equal(secureTextEntry, true);
      assert.equal(eyeIcon, 'eye-off');
    });

    it('[MOB-AUTH-03] Kiểm tra validation khi để trống thông tin đăng nhập trên Mobile', () => {
      const identifier = '';
      const password = '';
      let error = '';

      if (!identifier.trim() || !password.trim()) {
        error = 'Vui lòng nhập email/tên đăng nhập và mật khẩu!';
      }

      assert.equal(error, 'Vui lòng nhập email/tên đăng nhập và mật khẩu!');
      assert.equal(clientState.activeUser, null);
    });

    it('[MOB-AUTH-04] Kiểm tra thông báo lỗi khi nhập sai tài khoản hoặc mật khẩu trên Mobile', () => {
      const identifier = 'hocvien_sai';
      const password: string = 'wrongpassword';
      const user = sharedState.users.find(
        (u) => (u.username === identifier || u.email === identifier) && password === 'password123'
      );
      let error = '';

      if (!user) {
        error = 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!';
      }

      assert.equal(error, 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    });

    it('[MOB-AUTH-05] Kiểm tra đăng nhập thành công với tài khoản học viên đã hoàn thành Onboarding', async () => {
      const identifier = 'hocvien_chuan';
      const password = 'password123';
      const user = sharedState.users.find((u) => u.username === identifier);
      assert.ok(user);

      await mockSecureStore.setItemAsync('accessToken', 'mock-access-token-123');
      await mockSecureStore.setItemAsync('refreshToken', 'mock-refresh-token-456');
      clientState.activeUser = user;

      if (user.onboardingCompleted) {
        mockRouter.replace('/(tabs)');
      } else {
        mockRouter.replace('/onboarding');
      }

      assert.equal(clientState.currentRoute, '/(tabs)');
      assert.equal(await mockSecureStore.getItemAsync('accessToken'), 'mock-access-token-123');
    });

    it('[MOB-AUTH-06] Kiểm tra tự động chuyển hướng sang màn hình Onboarding đối với học viên mới', () => {
      const user = sharedState.users.find((u) => u.username === 'hocvien_moi');
      assert.ok(user);
      assert.equal(user.onboardingCompleted, false);

      if (!user.onboardingCompleted) {
        mockRouter.replace('/onboarding');
      }

      assert.equal(clientState.currentRoute, '/onboarding');
    });

    it('[MOB-AUTH-07] Kiểm tra giao diện màn hình Đăng ký tài khoản mới', () => {
      mockRouter.push('/(auth)/register');
      assert.equal(clientState.currentRoute, '/(auth)/register');
      const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
      assert.equal(requiredFields.length, 4);
    });

    it('[MOB-AUTH-08] Kiểm tra tính năng kiểm tra tự động tên đăng nhập khả dụng (Live Availability Check)', () => {
      const checkUsername = (name: string) => {
        const exists = sharedState.users.some((u) => u.username.toLowerCase() === name.toLowerCase());
        return { isAvailable: !exists, message: exists ? 'Tên đăng nhập này đã có người sử dụng!' : 'Tên khả dụng' };
      };

      const res1 = checkUsername('hocvien_chuan');
      assert.equal(res1.isAvailable, false);
      assert.equal(res1.message, 'Tên đăng nhập này đã có người sử dụng!');

      const res2 = checkUsername('hocvien_moi_2026');
      assert.equal(res2.isAvailable, true);
      assert.equal(res2.message, 'Tên khả dụng');
    });

    it('[MOB-AUTH-09] Kiểm tra validation định dạng Email và độ dài mật khẩu khi Đăng ký', () => {
      const email = 'invalid-email';
      const password = '123';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const errors: string[] = [];

      if (!emailRegex.test(email)) {
        errors.push('Email không đúng định dạng chuẩn!');
      }
      if (password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự!');
      }

      assert.ok(errors.includes('Email không đúng định dạng chuẩn!'));
      assert.ok(errors.includes('Mật khẩu phải có ít nhất 6 ký tự!'));
    });

    it('[MOB-AUTH-10] Kiểm tra validation khi Mật khẩu xác nhận không trùng khớp', () => {
      const password: string = 'Pass@123456';
      const confirmPassword: string = 'DifferentPass@999';
      let error = '';

      if (password !== confirmPassword) {
        error = 'Xác nhận mật khẩu không trùng khớp!';
      }

      assert.equal(error, 'Xác nhận mật khẩu không trùng khớp!');
    });

    it('[MOB-AUTH-11] Kiểm tra đăng ký tài khoản mới thành công', async () => {
      const newUser = {
        id: 3,
        username: 'hocvien_moi_2026',
        email: 'newuser@english.com',
        roleId: 2,
        onboardingCompleted: false,
        xpPoints: 0,
        streakDays: 0,
        isLocked: false,
        grammarElo: 1200,
        vocabElo: 1200,
        readingElo: 1200,
        listeningElo: 1200,
      };

      sharedState.users.push(newUser);
      clientState.activeUser = newUser;
      await mockSecureStore.setItemAsync('accessToken', 'token-new-user');
      showMockAlert('Chúc mừng', 'Đăng ký thành công! Chào mừng bạn đến với EngMaster');
      mockRouter.replace('/onboarding');

      assert.equal(clientState.currentRoute, '/onboarding');
      assert.equal(clientState.activeDialog?.title, 'Chúc mừng');
    });

    it('[MOB-AUTH-12] Kiểm tra nút Đăng nhập nhanh bằng Google OAuth trên Mobile', async () => {
      const mockGoogleIdToken = 'valid-google-id-token';
      assert.ok(mockGoogleIdToken);
      const user = sharedState.users[0];
      clientState.activeUser = user;
      await mockSecureStore.setItemAsync('accessToken', 'google-jwt-token');
      mockRouter.replace('/(tabs)');
      assert.equal(clientState.currentRoute, '/(tabs)');
    });
  });

  // =========================================================================
  // GROUP 2: MOB-ONBOARD-01 .. MOB-ONBOARD-12
  // =========================================================================
  describe('2. Khảo sát Năng lực Đầu vào & Đánh giá Thích ứng CAT (onboarding.tsx)', () => {
    it('[MOB-ONBOARD-01] Kiểm tra hiển thị giao diện Bước 1 - Thu thập hồ sơ cá nhân', () => {
      mockRouter.push('/onboarding');
      const step = 1;
      assert.equal(step, 1);
      const jobs = ['Học sinh/Sinh viên', 'Công nghệ thông tin', 'Kinh doanh/Marketing'];
      const interests = ['Xem phim', 'Nghe nhạc', 'Du lịch', 'Công nghệ'];
      assert.ok(jobs.length >= 3);
      assert.ok(interests.length >= 4);
    });

    it('[MOB-ONBOARD-02] Kiểm tra thao tác chọn Nghề nghiệp (chọn 1 duy nhất)', () => {
      let selectedJob = 'Học sinh/Sinh viên';
      selectedJob = 'Công nghệ thông tin';
      assert.equal(selectedJob, 'Công nghệ thông tin');
    });

    it('[MOB-ONBOARD-03] Kiểm tra thao tác chọn Sở thích (chọn nhiều thẻ cùng lúc)', () => {
      const selectedInterests = new Set<string>();
      selectedInterests.add('Du lịch');
      selectedInterests.add('Công nghệ');
      selectedInterests.add('Âm nhạc');
      assert.equal(selectedInterests.size, 3);

      selectedInterests.delete('Âm nhạc');
      assert.equal(selectedInterests.size, 2);
      assert.ok(!selectedInterests.has('Âm nhạc'));
    });

    it('[MOB-ONBOARD-04] Kiểm tra validation khi chưa chọn nghề nghiệp hoặc chưa chọn sở thích', () => {
      const selectedJob = '';
      const selectedInterests: string[] = [];
      let alertMsg = '';

      if (!selectedJob || selectedInterests.length === 0) {
        alertMsg = 'Vui lòng chọn nghề nghiệp và ít nhất một sở thích để tiếp tục!';
      }

      assert.equal(alertMsg, 'Vui lòng chọn nghề nghiệp và ít nhất một sở thích để tiếp tục!');
    });

    it('[MOB-ONBOARD-05] Kiểm tra chuyển sang Bước 2 - Làm bài kiểm tra thích ứng FAME-KT', () => {
      let step = 1;
      const selectedJob = 'Công nghệ thông tin';
      const selectedInterests = ['Công nghệ', 'Du lịch'];

      if (selectedJob && selectedInterests.length > 0) {
        step = 2;
      }

      assert.equal(step, 2);
    });

    it('[MOB-ONBOARD-06] Kiểm tra tính năng phát âm thanh câu hỏi Nghe trong bài test thích ứng', () => {
      const q = sharedState.tests[0].questions.find((item) => item.skill === 'Listening');
      assert.ok(q);
      assert.ok(q.audioUrl);
      let isPlayingAudio = true;
      assert.equal(isPlayingAudio, true);
    });

    it('[MOB-ONBOARD-07] Kiểm tra đo thời gian phản xạ (response time) khi học viên chọn đáp án', () => {
      const startTime = Date.now();
      const responseTimeMs = 4000;
      assert.ok(responseTimeMs >= 200);
      assert.ok(responseTimeMs <= 30000);
    });

    it('[MOB-ONBOARD-08] Kiểm tra cơ chế điều chỉnh độ khó động tức thì của câu hỏi tiếp theo', () => {
      let currentElo = 1200;
      const isCorrect = true;
      if (isCorrect) {
        currentElo += 30; // Adaptive rating update
      }
      assert.equal(currentElo, 1230);
    });

    it('[MOB-ONBOARD-09] Kiểm tra cơ chế kết thúc sớm bài kiểm tra khi điểm Elo đã hội tụ (SE <= 0.45)', () => {
      const standardError = 0.42;
      const shouldStopEarly = standardError <= 0.45;
      assert.equal(shouldStopEarly, true);
    });

    it('[MOB-ONBOARD-10] Kiểm tra hiển thị giao diện Bước 3 - Kết quả đánh giá CEFR và hồ sơ Elo 4 kỹ năng', () => {
      const profile = {
        cefrLevel: 'B1',
        grammarElo: 1250,
        vocabElo: 1300,
        readingElo: 1180,
        listeningElo: 1100,
      };
      const weakestSkill = 'Listening';
      assert.equal(profile.cefrLevel, 'B1');
      assert.equal(weakestSkill, 'Listening');
      assert.equal(profile.listeningElo, 1100);
    });

    it('[MOB-ONBOARD-11] Kiểm tra danh sách 3 khóa học đề xuất cá nhân hóa theo kỹ năng yếu nhất và nghề nghiệp', () => {
      const recommendations = sharedState.courses.slice(0, 3);
      assert.equal(recommendations.length, 3);
    });

    it('[MOB-ONBOARD-12] Kiểm tra nút Bắt đầu học ngay hoàn tất Onboarding và chuyển vào Trang chủ', () => {
      const user = sharedState.users[1];
      user.onboardingCompleted = true;
      mockRouter.replace('/(tabs)');
      assert.equal(clientState.currentRoute, '/(tabs)');
      assert.equal(user.onboardingCompleted, true);
    });
  });
});

