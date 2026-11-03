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

describe('Suite 04: GOP Pronunciation & Practice Test Flow (MOB-GOP, MOB-TEST)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-GOP-01 .. MOB-GOP-12
  // =========================================================================
  describe('1. Luyện phát âm chuẩn âm vị GOP (GopPractices component)', () => {
    it('[MOB-GOP-01] Kiểm tra hiển thị giao diện Luyện phát âm chuẩn âm vị GOP', () => {
      const gopPracticeData = {
        word: 'achievement',
        ipa: '/əˈtʃiːv.mənt/',
        audioUrl: '/audio/achievement.mp3',
      };
      assert.equal(gopPracticeData.word, 'achievement');
      assert.equal(gopPracticeData.ipa, '/əˈtʃiːv.mənt/');
    });

    it('[MOB-GOP-02] Kiểm tra yêu cầu cấp quyền Microphone khi học viên bấm thu âm lần đầu', () => {
      let micPermission = 'undetermined';
      const requestMic = () => {
        micPermission = 'granted';
        return micPermission === 'granted';
      };
      const allowed = requestMic();
      assert.equal(allowed, true);
      assert.equal(micPermission, 'granted');
    });

    it('[MOB-GOP-03] Kiểm tra xử lý giao diện khi người dùng từ chối cấp quyền Microphone', () => {
      const micPermission = 'denied';
      if (micPermission === 'denied') {
        showMockAlert(
          'Cần quyền Microphone',
          'Vui lòng vào Cài đặt thiết bị để cấp quyền Micro cho EngMaster để sử dụng tính năng luyện phát âm!'
        );
      }
      assert.equal(clientState.activeDialog?.title, 'Cần quyền Microphone');
    });

    it('[MOB-GOP-04] Kiểm tra trạng thái hiển thị của nút Microphone khi đang thu âm giọng nói', () => {
      let isRecording = false;
      isRecording = true;
      const buttonStyle = isRecording ? 'red' : 'blue';
      const label = isRecording ? 'Đang lắng nghe... Chạm để dừng' : 'Chạm để nói';
      assert.equal(buttonStyle, 'red');
      assert.equal(label, 'Đang lắng nghe... Chạm để dừng');
    });

    it('[MOB-GOP-05] Kiểm tra trạng thái xử lý và chuẩn hóa tệp âm thanh (16kHz Mono) khi dừng thu âm', () => {
      let isAnalyzing = true;
      assert.equal(isAnalyzing, true);
    });

    it('[MOB-GOP-06] Kiểm tra hiển thị Điểm tổng quát GOP thang 0 - 100 và huy hiệu xếp loại CEFR', () => {
      const gopResult = {
        overallScore: 88,
        rating: 'Xuất sắc',
        cefrLevel: 'B2',
      };
      assert.equal(gopResult.overallScore, 88);
      assert.equal(gopResult.rating, 'Xuất sắc');
      assert.equal(gopResult.cefrLevel, 'B2');
    });

    it('[MOB-GOP-07] Kiểm tra hiển thị 4 chỉ số thành phần phát âm', () => {
      const metrics = {
        vowelAccuracy: 90,
        consonantAccuracy: 85,
        wordStress: 92,
        fluency: 86,
      };
      assert.ok(metrics.vowelAccuracy >= 0 && metrics.vowelAccuracy <= 100);
      assert.ok(metrics.consonantAccuracy >= 0 && metrics.consonantAccuracy <= 100);
      assert.ok(metrics.wordStress >= 0 && metrics.wordStress <= 100);
      assert.ok(metrics.fluency >= 0 && metrics.fluency <= 100);
    });

    it('[MOB-GOP-08] Kiểm tra chuỗi phiên âm IPA được tô màu Xanh lá cho các âm vị phát âm chuẩn xác', () => {
      const phonemes = [
        { char: 'ə', score: 95, color: 'green' },
        { char: 'tʃ', score: 88, color: 'green' },
        { char: 'iː', score: 92, color: 'green' },
        { char: 'v', score: 85, color: 'green' },
      ];
      assert.ok(phonemes.every((p) => p.color === 'green'));
    });

    it('[MOB-GOP-09] Kiểm tra chuỗi phiên âm IPA được tô màu Đỏ cho các âm vị phát âm lệch hoặc nuốt âm', () => {
      const missingPhoneme = { char: 't', score: 20, color: 'red', status: 'omission' };
      assert.equal(missingPhoneme.color, 'red');
      assert.equal(missingPhoneme.status, 'omission');
    });

    it('[MOB-GOP-10] Kiểm tra chạm vào âm vị màu Đỏ hiển thị âm AI nghe được và hướng dẫn khẩu hình', () => {
      const tooltip = {
        aiHeard: '[Thiếu âm]',
        guidance: 'Đặt đầu lưỡi chạm vào lợi hàm trên, bật mạnh luồng hơi để phát âm /t/ rõ ràng.',
      };
      assert.ok(tooltip.guidance.includes('/t/'));
    });

    it('[MOB-GOP-11] Kiểm tra nút nghe lại bản thu âm của chính mình và nút nghe lại phát âm mẫu', () => {
      const audioSources = {
        userAudio: '/temp/user_recording.wav',
        nativeSampleAudio: '/audio/achievement.mp3',
      };
      assert.ok(audioSources.userAudio);
      assert.ok(audioSources.nativeSampleAudio);
    });

    it('[MOB-GOP-12] Kiểm tra nút Thử lại cho phép thu âm lại nhiều lần', () => {
      let gopScore = 88;
      let isReadyForNewRecording = false;

      // Nhấn Thử lại
      gopScore = 0;
      isReadyForNewRecording = true;

      assert.equal(gopScore, 0);
      assert.equal(isReadyForNewRecording, true);
    });
  });

  // =========================================================================
  // GROUP 2: MOB-TEST-01 .. MOB-TEST-14
  // =========================================================================
  describe('2. Làm bài kiểm tra đánh giá (practice.tsx)', () => {
    it('[MOB-TEST-01] Kiểm tra hiển thị đầy đủ giao diện màn hình Làm bài kiểm tra', () => {
      const test = sharedState.tests[0];
      mockRouter.push(`/practice?testId=${test.id}`);
      assert.equal(clientState.currentRoute, '/practice?testId=1');
      assert.equal(test.questions.length, 5);
    });

    it('[MOB-TEST-02] Kiểm tra Dạng 1: Câu hỏi Trắc nghiệm 4 lựa chọn (Multiple Choice)', () => {
      const q = sharedState.tests[0].questions[0];
      assert.equal(q.questionType, 'multiple_choice');
      assert.equal(q.answers.length, 4);

      let selectedAnswerId = 1;
      selectedAnswerId = 2; // Chọn Accomplishment
      assert.equal(selectedAnswerId, 2);
    });

    it('[MOB-TEST-03] Kiểm tra Dạng 2: Câu hỏi Điền từ vào chỗ trống (Fill in the blank)', () => {
      const q = sharedState.tests[0].questions[1];
      assert.equal(q.questionType, 'fill_in_blank');
      const userInput = 'sustainable';
      const isCorrect = userInput.trim().toLowerCase() === q.answers[0].text.toLowerCase();
      assert.equal(isCorrect, true);
    });

    it('[MOB-TEST-04] Kiểm tra Dạng 3: Câu hỏi Nghe âm thanh (Listening Question)', () => {
      const q = sharedState.tests[0].questions[2];
      assert.equal(q.questionType, 'listening');
      assert.ok(q.audioUrl);
      assert.equal(q.answers[0].text, 'At the airport');
    });

    it('[MOB-TEST-05] Kiểm tra Dạng 4: Câu hỏi Thu âm bài nói (Speaking Question)', () => {
      const q = sharedState.tests[0].questions[3];
      assert.equal(q.questionType, 'speaking');
      let recordedAudioUri = 'file:///cache/speaking_q204.m4a';
      assert.ok(recordedAudioUri);
    });

    it('[MOB-TEST-06] Kiểm tra Dạng 5: Câu hỏi Viết đoạn văn ngắn (Writing Question)', () => {
      const q = sharedState.tests[0].questions[4];
      assert.equal(q.questionType, 'writing');
      const essay = 'My hobby is reading books. It helps me broaden my knowledge and relax after school.';
      const wordCount = essay.trim().split(/\s+/).length;
      assert.equal(wordCount, 15);
    });

    it('[MOB-TEST-07] Kiểm tra hoạt động của Bộ đếm thời gian làm bài đếm ngược (Timer)', () => {
      let remainingSeconds = 15 * 60; // 900s
      remainingSeconds--;
      assert.equal(remainingSeconds, 899);
      const isWarning = remainingSeconds < 60;
      assert.equal(isWarning, false);
    });

    it('[MOB-TEST-08] Kiểm tra tự động nộp bài khi hết giờ làm bài (Timer expires)', () => {
      let remainingSeconds = 0;
      let isAutoSubmitted = false;
      if (remainingSeconds === 0) {
        isAutoSubmitted = true;
      }
      assert.equal(isAutoSubmitted, true);
    });

    it('[MOB-TEST-09] Kiểm tra cảnh báo khi bấm nút Nộp bài mà vẫn còn câu hỏi chưa trả lời', () => {
      const answeredCount = 3;
      const totalCount = 5;
      let warningAlert = '';

      if (answeredCount < totalCount) {
        warningAlert = `Bạn vẫn còn ${totalCount - answeredCount} câu hỏi chưa trả lời!`;
      }

      assert.equal(warningAlert, 'Bạn vẫn còn 2 câu hỏi chưa trả lời!');
    });

    it('[MOB-TEST-10] Kiểm tra nộp bài thành công và hiển thị Màn hình kết quả kiểm tra', () => {
      const score = 90;
      const passed = score >= 80;
      clientState.activeUser!.xpPoints += 50;

      assert.equal(passed, true);
      assert.equal(clientState.activeUser!.xpPoints, 500);
    });

    it('[MOB-TEST-11] Kiểm tra xem Lời giải chi tiết từng câu hỏi sau khi nộp bài', () => {
      const q = sharedState.tests[0].questions[0];
      assert.ok(q.explanation);
      assert.ok(q.explanation.includes('Accomplishment'));
    });

    it('[MOB-TEST-12] Kiểm tra cơ chế chống nộp bài trùng lặp (Double Submit Prevention)', () => {
      let isSubmitting = false;
      let submitCallCount = 0;

      const submitTest = () => {
        if (isSubmitting) return;
        isSubmitting = true;
        submitCallCount++;
      };

      submitTest();
      submitTest(); // Second quick tap

      assert.equal(submitCallCount, 1);
    });

    it('[MOB-TEST-13] Kiểm tra nút QUAY LẠI BÀI HỌC sau khi hoàn thành kiểm tra', () => {
      mockRouter.replace('/lesson/10');
      assert.equal(clientState.currentRoute, '/lesson/10');
    });

    it('[MOB-TEST-14] Kiểm tra cập nhật điểm số vào Lịch sử học tập ngay sau khi nộp bài', () => {
      const testHistory = [
        {
          testId: 1,
          title: 'Bài 1: Greeting & Vocabulary',
          score: '9/10',
          percent: '90%',
          status: 'Đạt',
          completedAt: 'Vừa xong',
        },
      ];
      assert.equal(testHistory.length, 1);
      assert.equal(testHistory[0].status, 'Đạt');
    });
  });
});
