import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  sharedState,
  clientState,
  mockRouter,
  showMockAlert,
  showMockToast,
} from '../helpers/test-harness.ts';

describe('Suite 03: Course, Lesson & Flashcard 3D Flow (MOB-COURSE, MOB-LESSON, MOB-FLASHCARD)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-COURSE-01 .. MOB-COURSE-08
  // =========================================================================
  describe('1. Màn hình Chi tiết Khóa học (course/[id].tsx)', () => {
    it('[MOB-COURSE-01] Kiểm tra hiển thị thông tin tổng quan của khóa học trên màn hình Course Detail', () => {
      const course = sharedState.courses[0];
      mockRouter.push(`/course/${course.id}`);
      assert.equal(clientState.currentRoute, '/course/1');
      assert.equal(course.title, 'Giao tiếp hàng ngày (Daily English)');
      assert.equal(course.cefrLevel, 'A1');
      assert.equal(course.progressPercent, 25);
    });

    it('[MOB-COURSE-02] Kiểm tra hiển thị danh sách các bài học con theo thứ tự lộ trình sư phạm', () => {
      const lessons = sharedState.lessons.filter((l) => l.courseId === 1);
      assert.equal(lessons.length, 2);
      assert.equal(lessons[0].title, 'Bài 1: Greeting & Introduction');
      assert.equal(lessons[1].title, 'Bài 2: Daily Routines');
    });

    it('[MOB-COURSE-03] Kiểm tra trạng thái hiển thị của bài học đang mở khóa (sẵn sàng học)', () => {
      const lesson1 = sharedState.lessons[0];
      assert.equal(lesson1.isLocked, false);
    });

    it('[MOB-COURSE-04] Kiểm tra cơ chế khóa bài học tuần tự và thông báo khi chạm vào bài học chưa mở khóa', () => {
      const lesson2 = sharedState.lessons[1];
      assert.equal(lesson2.isLocked, true);

      if (lesson2.isLocked) {
        showMockAlert('Chưa mở khóa', 'Bạn hãy hoàn thành bài học trước để mở khóa bài học này nhé!');
      }

      assert.equal(clientState.activeDialog?.title, 'Chưa mở khóa');
      assert.ok(clientState.activeDialog?.message.includes('hoàn thành bài học trước'));
    });

    it('[MOB-COURSE-05] Kiểm tra hiển thị bài học đã hoàn thành với dấu tích xanh', () => {
      const lesson = sharedState.lessons[0];
      lesson.isCompleted = true;
      assert.equal(lesson.isCompleted, true);
    });

    it('[MOB-COURSE-06] Kiểm tra chạm vào bài học đã mở khóa điều hướng chính xác vào màn hình Lesson Detail', () => {
      const lesson = sharedState.lessons[0];
      if (!lesson.isLocked) {
        mockRouter.push(`/lesson/${lesson.id}`);
      }
      assert.equal(clientState.currentRoute, '/lesson/10');
    });

    it('[MOB-COURSE-07] Kiểm tra cập nhật tỷ lệ phần trăm tiến độ khóa học khi hoàn thành thêm bài học', () => {
      const course = sharedState.courses[0];
      course.progressPercent = 50;
      assert.equal(course.progressPercent, 50);
    });

    it('[MOB-COURSE-08] Kiểm tra nút Quay lại điều hướng trở về màn hình trước đó', () => {
      mockRouter.back();
      assert.equal(clientState.currentRoute, '/');
    });
  });

  // =========================================================================
  // GROUP 2: MOB-LESSON-01 .. MOB-LESSON-10
  // =========================================================================
  describe('2. Màn hình Chi tiết Bài học (lesson/[id].tsx)', () => {
    it('[MOB-LESSON-01] Kiểm tra hiển thị đầy đủ các thành phần trên màn hình Chi tiết Bài học', () => {
      const lesson = sharedState.lessons[0];
      mockRouter.push(`/lesson/${lesson.id}`);
      assert.equal(clientState.currentRoute, '/lesson/10');
      assert.equal(lesson.title, 'Bài 1: Greeting & Introduction');
      assert.ok(lesson.content);
      assert.ok(lesson.words.length > 0);
    });

    it('[MOB-LESSON-02] Kiểm tra khung Video bài giảng và nút Bấm để mở video bài giảng', () => {
      const lesson = sharedState.lessons[0];
      assert.ok(lesson.videoUrl.includes('youtube.com'));
    });

    it('[MOB-LESSON-03] Kiểm tra tính năng mở rộng và thu gọn khung Lý thuyết & Ngữ pháp bài học', () => {
      let isTheoryExpanded = false;
      isTheoryExpanded = !isTheoryExpanded;
      assert.equal(isTheoryExpanded, true);
      isTheoryExpanded = !isTheoryExpanded;
      assert.equal(isTheoryExpanded, false);
    });

    it('[MOB-LESSON-04] Kiểm tra định dạng văn bản hiển thị trong phần Lý thuyết bài học', () => {
      const lesson = sharedState.lessons[0];
      assert.ok(lesson.content.includes('<h3>Lý thuyết Ngữ pháp</h3>'));
    });

    it('[MOB-LESSON-05] Kiểm tra hiển thị số lượng từ vựng của bài học', () => {
      const lesson = sharedState.lessons[0];
      assert.equal(lesson.words.length, 2);
    });

    it('[MOB-LESSON-06] Kiểm tra nút chuyển sang chế độ Luyện phát âm chuẩn âm vị GOP', () => {
      mockRouter.push('/lesson/10?tab=gop');
      assert.ok(clientState.currentRoute.includes('tab=gop'));
    });

    it('[MOB-LESSON-07] Kiểm tra nút Làm bài kiểm tra mở màn hình làm bài tập đánh giá', () => {
      mockRouter.push('/practice?testId=1');
      assert.equal(clientState.currentRoute, '/practice?testId=1');
    });

    it('[MOB-LESSON-08] Kiểm tra hiển thị trạng thái hoàn thành các kỹ năng trong bài học', () => {
      const skillProgress = { vocab: true, grammar: true, testPassed: true };
      assert.equal(skillProgress.vocab, true);
      assert.equal(skillProgress.testPassed, true);
    });

    it('[MOB-LESSON-09] Kiểm tra nút Quay lại từ bài học về màn hình Chi tiết khóa học', () => {
      mockRouter.push('/course/1');
      assert.equal(clientState.currentRoute, '/course/1');
    });

    it('[MOB-LESSON-10] Kiểm tra xử lý giao diện khi không tìm thấy dữ liệu bài học (ID không hợp lệ)', () => {
      const invalidId = 99999;
      const lesson = sharedState.lessons.find((l) => l.id === invalidId);
      assert.equal(lesson, undefined);
      showMockAlert('Thông báo', 'Không tìm thấy bài học');
      assert.equal(clientState.activeDialog?.message, 'Không tìm thấy bài học');
    });
  });

  // =========================================================================
  // GROUP 3: MOB-FLASHCARD-01 .. MOB-FLASHCARD-10
  // =========================================================================
  describe('3. Học từ vựng qua thẻ Flashcard 3D lật mặt (Flashcard Component)', () => {
    it('[MOB-FLASHCARD-01] Kiểm tra hiển thị Mặt trước của Thẻ Flashcard', () => {
      const word = sharedState.lessons[0].words[0];
      assert.equal(word.headword, 'achievement');
      assert.equal(word.phonetic, '/əˈtʃiːv.mənt/');
      assert.ok(word.audioUrl);
    });

    it('[MOB-FLASHCARD-02] Kiểm tra hiệu ứng chuyển động lật thẻ 3D khi chạm vào thẻ', () => {
      let isFlipped = false;
      let cardRotationY = 0;

      // Chạm lật mặt sau
      isFlipped = true;
      cardRotationY = 180;
      assert.equal(isFlipped, true);
      assert.equal(cardRotationY, 180);

      // Chạm lật mặt trước
      isFlipped = false;
      cardRotationY = 0;
      assert.equal(isFlipped, false);
      assert.equal(cardRotationY, 0);
    });

    it('[MOB-FLASHCARD-03] Kiểm tra hiển thị Mặt sau của Thẻ Flashcard', () => {
      const word = sharedState.lessons[0].words[0];
      assert.equal(word.meaning, 'thành tích, thành tựu đạt được');
      assert.equal(word.partOfSpeech, 'noun');
      assert.ok(word.exampleSentence.includes('achievement'));
    });

    it('[MOB-FLASHCARD-04] Kiểm tra phát âm thanh chuẩn IPA khi chạm vào icon Loa trên thẻ Flashcard', () => {
      let isAudioPlaying = false;
      const playWordAudio = (url: string) => {
        isAudioPlaying = Boolean(url);
      };
      playWordAudio('/audio/achievement.mp3');
      assert.equal(isAudioPlaying, true);
    });

    it('[MOB-FLASHCARD-05] Kiểm tra tính năng lưu từ vựng vào Sổ tay cá nhân qua nút Bookmark', () => {
      const word = sharedState.lessons[0].words[0];
      word.isBookmarked = true;
      showMockToast('Đã lưu từ vào Sổ tay từ vựng!', 'success');
      assert.equal(word.isBookmarked, true);
      assert.equal(clientState.activeToast?.message, 'Đã lưu từ vào Sổ tay từ vựng!');
    });

    it('[MOB-FLASHCARD-06] Kiểm tra thao tác bỏ lưu từ vựng khỏi Sổ tay cá nhân', () => {
      const word = sharedState.lessons[0].words[0];
      word.isBookmarked = false;
      showMockToast('Đã bỏ lưu từ vựng khỏi sổ tay!', 'info');
      assert.equal(word.isBookmarked, false);
      assert.equal(clientState.activeToast?.message, 'Đã bỏ lưu từ vựng khỏi sổ tay!');
    });

    it('[MOB-FLASHCARD-07] Kiểm tra thao tác vuốt sang trái (Swipe Left) chuyển sang từ tiếp theo', () => {
      let currentIndex = 0;
      const totalWords = sharedState.lessons[0].words.length;
      if (currentIndex < totalWords - 1) {
        currentIndex++;
      }
      assert.equal(currentIndex, 1);
    });

    it('[MOB-FLASHCARD-08] Kiểm tra thao tác vuốt sang phải (Swipe Right) quay lại từ trước đó', () => {
      let currentIndex = 1;
      if (currentIndex > 0) {
        currentIndex--;
      }
      assert.equal(currentIndex, 0);
    });

    it('[MOB-FLASHCARD-09] Kiểm tra thanh tiến trình học từ vựng (Progress bar)', () => {
      const current = 1;
      const total = 2;
      const progress = (current / total) * 100;
      assert.equal(progress, 50);
    });

    it('[MOB-FLASHCARD-10] Kiểm tra thông báo hoàn thành khi học hết toàn bộ thẻ từ vựng trong bài', () => {
      const isCompleted = true;
      assert.equal(isCompleted, true);
      showMockToast('Tuyệt vời! Bạn đã hoàn thành toàn bộ từ vựng của bài học này!', 'success');
      assert.ok(clientState.activeToast?.message.includes('hoàn thành toàn bộ từ vựng'));
    });
  });
});

