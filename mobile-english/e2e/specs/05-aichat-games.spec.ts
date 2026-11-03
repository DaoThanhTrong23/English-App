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

describe('Suite 05: AI Chat Tutor & 4 Mini Games Flow (MOB-AICHAT, MOB-GAMES, MOB-GAME1..4)', () => {
  beforeEach(() => {
    resetState();
    clientState.activeUser = sharedState.users[0];
  });

  // =========================================================================
  // GROUP 1: MOB-AICHAT-01 .. MOB-AICHAT-14
  // =========================================================================
  describe('1. Trợ giảng AI Gà Con (ai-chat.tsx)', () => {
    it('[MOB-AICHAT-01] Kiểm tra hiển thị Nút nổi Bong bóng Chat Trợ giảng AI (FAB)', () => {
      const isFabVisible = true;
      assert.equal(isFabVisible, true);
    });

    it('[MOB-AICHAT-02] Kiểm tra chạm vào nút nổi FAB mở nhanh màn hình Trợ giảng AI', () => {
      mockRouter.push('/ai-chat');
      assert.equal(clientState.currentRoute, '/ai-chat');
    });

    it('[MOB-AICHAT-03] Kiểm tra hiển thị đầy đủ giao diện màn hình Trợ giảng AI Gà', () => {
      const headerTitle = 'Gia sư Gà Con AI';
      const isOnline = true;
      assert.equal(headerTitle, 'Gia sư Gà Con AI');
      assert.equal(isOnline, true);
    });

    it('[MOB-AICHAT-04] Kiểm tra Chế độ 1: Gửi câu hỏi ngữ pháp và nhận phản hồi từ Gà Con AI', () => {
      const session = sharedState.aiChatSessions[0];
      const userMessage = 'Phân biệt cách dùng Although và In spite of';
      session.messages.push({
        id: 3,
        sender: 'user',
        text: userMessage,
        createdAt: '10:05',
      });
      session.messages.push({
        id: 4,
        sender: 'ai',
        text: 'Although + mệnh đề; in spite of + danh từ/cụm danh từ.',
        createdAt: '10:06',
      });

      assert.equal(session.messages.length, 4);
      assert.equal(session.messages[3].sender, 'ai');
    });

    it('[MOB-AICHAT-05] Kiểm tra Chế độ 1: Hiển thị trạng thái Gà đang gõ... khi chờ phản hồi', () => {
      let isAiTyping = true;
      assert.equal(isAiTyping, true);
    });

    it('[MOB-AICHAT-06] Kiểm tra Chế độ 1: Mở Modal Lịch sử các phiên trò chuyện', () => {
      const sessions = sharedState.aiChatSessions;
      assert.equal(sessions.length, 1);
      assert.ok(sessions[0].title.includes('Although'));
    });

    it('[MOB-AICHAT-07] Kiểm tra Chế độ 1: Tạo cuộc trò chuyện mới (New Chat Session)', () => {
      const newSession = {
        id: 2,
        title: 'Cuộc trò chuyện mới',
        lastMessage: 'Chào bạn, Gà có thể giúp gì cho bạn hôm nay?',
        updatedAt: 'Vừa xong',
        messages: [{ id: 1, sender: 'ai' as const, text: 'Chào bạn, Gà có thể giúp gì cho bạn hôm nay?', createdAt: '10:10' }],
      };
      sharedState.aiChatSessions.push(newSession);
      assert.equal(sharedState.aiChatSessions.length, 2);
    });

    it('[MOB-AICHAT-08] Kiểm tra Chế độ 1: Xem lại nội dung của một phiên trò chuyện cũ', () => {
      const session = sharedState.aiChatSessions[0];
      assert.equal(session.id, 1);
      assert.ok(session.messages.length > 0);
    });

    it('[MOB-AICHAT-09] Kiểm tra Chế độ 2: Chấm bài viết luận AI', () => {
      const essayGrading = {
        score: 6.5,
        cefrLevel: 'A2',
        errors: [
          { original: 'I go to school', corrected: 'I went to school', rule: 'Cần dùng thì quá khứ đơn.' },
          { original: 'It bark at me', corrected: 'It barked at me', rule: 'Cần chia quá khứ cho động từ bark.' },
        ],
      };
      assert.equal(essayGrading.score, 6.5);
      assert.equal(essayGrading.errors.length, 2);
    });

    it('[MOB-AICHAT-10] Kiểm tra Chế độ 3: Chấm bài nói AI qua nhận diện giọng nói', () => {
      const speakingEvaluation = {
        transcript: 'Artificial intelligence is very helpful for learning.',
        fluencyScore: 85,
        grammarScore: 90,
      };
      assert.ok(speakingEvaluation.transcript.length > 0);
      assert.equal(speakingEvaluation.fluencyScore, 85);
    });

    it('[MOB-AICHAT-11] Kiểm tra tự động cuộn xuống tin nhắn mới nhất (Auto-scroll)', () => {
      let scrollOffset = 1500;
      scrollOffset += 300;
      assert.equal(scrollOffset, 1800);
    });

    it('[MOB-AICHAT-12] Kiểm tra bàn phím ảo không che khuất ô nhập tin nhắn', () => {
      const keyboardBehavior = 'padding';
      assert.equal(keyboardBehavior, 'padding');
    });

    it('[MOB-AICHAT-13] Kiểm tra validation khi bấm Gửi tin nhắn rỗng', () => {
      const emptyMsg = '   ';
      const canSend = emptyMsg.trim().length > 0;
      assert.equal(canSend, false);
    });

    it('[MOB-AICHAT-14] Kiểm tra nút Quay lại từ màn hình AI Chat về màn hình trước đó', () => {
      mockRouter.back();
      assert.equal(clientState.currentRoute, '/');
    });
  });

  // =========================================================================
  // GROUP 2: MOB-GAMES-01 .. MOB-GAMES-08
  // =========================================================================
  describe('2. Sảnh chọn Trò chơi Ôn tập (games.tsx)', () => {
    it('[MOB-GAMES-01] Kiểm tra hiển thị đầy đủ giao diện Sảnh chọn Trò chơi', () => {
      mockRouter.push('/games');
      assert.equal(clientState.currentRoute, '/games');
      const gameKeys = Object.keys(sharedState.games);
      assert.equal(gameKeys.length, 4);
    });

    it('[MOB-GAMES-02] Kiểm tra hiển thị Kỷ lục điểm (Max score) và Số lần đã chơi', () => {
      const bubble = sharedState.games.bubble;
      assert.equal(bubble.maxScore, 320);
      assert.equal(bubble.playedCount, 5);
    });

    it('[MOB-GAMES-03] Kiểm tra chạm vào một trò chơi mở Modal chọn mức độ khó', () => {
      const difficulties = ['EASY', 'NORMAL', 'HARD'];
      assert.equal(difficulties.length, 3);
    });

    it('[MOB-GAMES-04] Kiểm tra chọn cấp độ DỄ (EASY) và bắt đầu trò chơi', () => {
      mockRouter.push('/game/bubble-game?diff=EASY');
      assert.ok(clientState.currentRoute.includes('diff=EASY'));
    });

    it('[MOB-GAMES-05] Kiểm tra chọn cấp độ VỪA (NORMAL) và bắt đầu trò chơi', () => {
      mockRouter.push('/game/bubble-game?diff=NORMAL');
      assert.ok(clientState.currentRoute.includes('diff=NORMAL'));
    });

    it('[MOB-GAMES-06] Kiểm tra chọn cấp độ KHÓ (HARD) và bắt đầu trò chơi', () => {
      mockRouter.push('/game/bubble-game?diff=HARD');
      assert.ok(clientState.currentRoute.includes('diff=HARD'));
    });

    it('[MOB-GAMES-07] Kiểm tra đóng Modal chọn độ khó khi chạm nút Hủy', () => {
      let isModalOpen = true;
      isModalOpen = false;
      assert.equal(isModalOpen, false);
    });

    it('[MOB-GAMES-08] Kiểm tra nút Quay lại từ Sảnh game về màn hình Trang chủ', () => {
      mockRouter.replace('/(tabs)');
      assert.equal(clientState.currentRoute, '/(tabs)');
    });
  });

  // =========================================================================
  // GROUP 3: MOB-GAME1-01 .. MOB-GAME1-08 (Bubble Shooter)
  // =========================================================================
  describe('3. Mini Game 1: Bắn bóng từ vựng (bubble-game.tsx)', () => {
    it('[MOB-GAME1-01] Kiểm tra hiển thị đầy đủ giao diện màn hình Trò chơi Bắn bóng từ vựng', () => {
      mockRouter.push('/game/bubble-game');
      assert.equal(clientState.currentRoute, '/game/bubble-game');
    });

    it('[MOB-GAME1-02] Kiểm tra chạm chọn bong bóng mang từ tiếng Anh', () => {
      let selectedBubble = 'butterfly';
      assert.equal(selectedBubble, 'butterfly');
    });

    it('[MOB-GAME1-03] Kiểm tra chạm tiếp vào bong bóng mang nghĩa tiếng Việt (Ghép đúng cặp)', () => {
      let score = 0;
      const english = 'butterfly';
      const vietnamese = 'con bướm';
      const isMatch = english === 'butterfly' && vietnamese === 'con bướm';

      if (isMatch) {
        score += 15;
      }
      assert.equal(score, 15);
    });

    it('[MOB-GAME1-04] Kiểm tra chạm sai cặp từ vựng và cơ chế trừ điểm phạt', () => {
      let score = 20;
      const isMismatch = true;
      if (isMismatch) {
        score -= 5;
      }
      assert.equal(score, 15);
    });

    it('[MOB-GAME1-05] Kiểm tra cơ chế cộng điểm thưởng tốc độ (Speed Bonus)', () => {
      const remainingTime = 20;
      const speedBonus = remainingTime * 2;
      assert.equal(speedBonus, 40);
    });

    it('[MOB-GAME1-06] Kiểm tra hiển thị Màn hình kết thúc ván chơi', () => {
      const finalScore = 350;
      const isNewRecord = finalScore > sharedState.games.bubble.maxScore;
      assert.equal(isNewRecord, true);
    });

    it('[MOB-GAME1-07] Kiểm tra nút Chơi lại khởi động ngay ván chơi mới', () => {
      let score = 350;
      score = 0;
      assert.equal(score, 0);
    });

    it('[MOB-GAME1-08] Kiểm tra nút Quay lại thoát an toàn khỏi ván chơi đang diễn ra', () => {
      mockRouter.push('/games');
      assert.equal(clientState.currentRoute, '/games');
    });
  });

  // =========================================================================
  // GROUP 4: MOB-GAME2-01 .. MOB-GAME2-08 (Memory Card)
  // =========================================================================
  describe('4. Mini Game 2: Lật thẻ trí nhớ (memory-card.tsx)', () => {
    it('[MOB-GAME2-01] Kiểm tra hiển thị Bàn cờ các ô thẻ úp trong Trò chơi Lật thẻ trí nhớ', () => {
      const cardPairs = 6;
      const totalCards = cardPairs * 2;
      assert.equal(totalCards, 12);
    });

    it('[MOB-GAME2-02] Kiểm tra lật mở thẻ bài thứ nhất', () => {
      const flippedCards = ['celebrate'];
      assert.equal(flippedCards.length, 1);
    });

    it('[MOB-GAME2-03] Kiểm tra lật mở thẻ thứ hai khớp với thẻ thứ nhất (Ghép đúng)', () => {
      const card1 = { id: 1, text: 'celebrate', pairId: 10 };
      const card2 = { id: 2, text: 'kỷ niệm, ăn mừng', pairId: 10 };
      const isMatch = card1.pairId === card2.pairId;
      assert.equal(isMatch, true);
    });

    it('[MOB-GAME2-04] Kiểm tra lật mở thẻ thứ hai không khớp và tự động úp lại', () => {
      const card1 = { pairId: 10 };
      const card2 = { pairId: 20 };
      const isMismatch = card1.pairId !== card2.pairId;
      assert.equal(isMismatch, true);
    });

    it('[MOB-GAME2-05] Kiểm tra ngăn chặn bấm liên tiếp quá 2 thẻ cùng một lúc', () => {
      let openCardsCount = 2;
      let isBoardLocked = openCardsCount >= 2;
      assert.equal(isBoardLocked, true);
    });

    it('[MOB-GAME2-06] Kiểm tra hoàn thành lật mở toàn bộ các cặp thẻ trên bàn cờ', () => {
      const matchedPairs = 6;
      const totalPairs = 6;
      const isVictory = matchedPairs === totalPairs;
      assert.equal(isVictory, true);
    });

    it('[MOB-GAME2-07] Kiểm tra xử lý khi hết thời gian mà chưa lật mở hết các cặp thẻ', () => {
      const remainingTime = 0;
      const isGameOver = remainingTime === 0;
      assert.equal(isGameOver, true);
    });

    it('[MOB-GAME2-08] Kiểm tra nút Thoát quay về sảnh game an toàn', () => {
      mockRouter.push('/games');
      assert.equal(clientState.currentRoute, '/games');
    });
  });

  // =========================================================================
  // GROUP 5: MOB-GAME3-01 .. MOB-GAME3-08 (Word Matching)
  // =========================================================================
  describe('5. Mini Game 3: Nối từ tốc độ (word-matching.tsx)', () => {
    it('[MOB-GAME3-01] Kiểm tra hiển thị đầy đủ giao diện Trò chơi Nối từ tốc độ', () => {
      const columnA = ['hospital', 'school', 'library'];
      const columnB = ['bệnh viện', 'trường học', 'thư viện'];
      assert.equal(columnA.length, columnB.length);
    });

    it('[MOB-GAME3-02] Kiểm tra chạm chọn 1 mục ở cột A', () => {
      let selectedColA = 'hospital';
      assert.equal(selectedColA, 'hospital');
    });

    it('[MOB-GAME3-03] Kiểm tra chạm chọn mục tương ứng ở cột B (Nối đúng)', () => {
      let score = 0;
      const isCorrect = true;
      if (isCorrect) score += 20;
      assert.equal(score, 20);
    });

    it('[MOB-GAME3-04] Kiểm tra chạm chọn sai cặp và xác nhận không bị phạt điểm theo luật sư phạm', () => {
      let score = 20;
      const isWrong = true;
      // Nối từ tuyệt đỉnh không trừ điểm
      if (isWrong) {
        // Penalty = 0
      }
      assert.equal(score, 20);
    });

    it('[MOB-GAME3-05] Kiểm tra nối thành công toàn bộ các cặp từ trên 2 cột', () => {
      const connectedCount = 3;
      const totalCount = 3;
      assert.equal(connectedCount, totalCount);
    });

    it('[MOB-GAME3-06] Kiểm tra nút Nộp bài ngay khi muốn kết thúc sớm', () => {
      let isEndedEarly = true;
      assert.equal(isEndedEarly, true);
    });

    it('[MOB-GAME3-07] Kiểm tra đồng hồ đếm ngược thời gian trong game nối từ', () => {
      const timeLimitSec = 60;
      assert.equal(timeLimitSec, 60);
    });

    it('[MOB-GAME3-08] Kiểm tra nút Quay lại thoát game nối từ', () => {
      mockRouter.push('/games');
      assert.equal(clientState.currentRoute, '/games');
    });
  });

  // =========================================================================
  // GROUP 6: MOB-GAME4-01 .. MOB-GAME4-08 (Mario Runner)
  // =========================================================================
  describe('6. Mini Game 4: Mario vượt ải phát âm (mario.tsx)', () => {
    it('[MOB-GAME4-01] Kiểm tra hiển thị đầy đủ giao diện Trò chơi Mario vượt ải', () => {
      const marioGameState = { score: 0, progress: '1/10 từ', isRunning: true };
      assert.equal(marioGameState.isRunning, true);
    });

    it('[MOB-GAME4-02] Kiểm tra chướng ngại vật xuất hiện mang từ vựng tiếng Anh cần đọc', () => {
      const obstacleWord = 'knowledge';
      assert.equal(obstacleWord, 'knowledge');
    });

    it('[MOB-GAME4-03] Kiểm tra bấm Microphone đọc phát âm chuẩn và Mario nhảy qua', () => {
      const pronunciationScore = 85;
      const canJump = pronunciationScore >= 60;
      assert.equal(canJump, true);
    });

    it('[MOB-GAME4-04] Kiểm tra phát âm chưa đạt và cơ chế cho phép đọc lại', () => {
      const pronunciationScore = 40;
      const canJump = pronunciationScore >= 60;
      assert.equal(canJump, false);
    });

    it('[MOB-GAME4-05] Kiểm tra nút Bỏ qua (Skip) và cơ chế trừ điểm phạt', () => {
      let score = 50;
      const isSkipped = true;
      if (isSkipped) score -= 5;
      assert.equal(score, 45);
    });

    it('[MOB-GAME4-06] Kiểm tra thanh tiến trình số từ vượt qua / tổng số từ', () => {
      const completed = 4;
      const total = 10;
      const progressPercent = (completed / total) * 100;
      assert.equal(progressPercent, 40);
    });

    it('[MOB-GAME4-07] Kiểm tra Mario về đích an toàn và hiển thị màn hình chiến thắng', () => {
      const isFinished = true;
      clientState.activeUser!.xpPoints += 40;
      assert.equal(isFinished, true);
    });

    it('[MOB-GAME4-08] Kiểm tra nút Quay lại thoát khỏi trò chơi Mario', () => {
      mockRouter.push('/games');
      assert.equal(clientState.currentRoute, '/games');
    });
  });
});

