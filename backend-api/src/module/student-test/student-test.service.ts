import { achievementEvaluator } from '../achievement/achievement.evaluator.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/http/api-error.js';
import { updateAdvancedElo, getCEFRLevel } from '../onboarding/fame-kt.js';
import { notificationService } from '../notification/notification.service.js';
import { logExecution } from '../../shared/decorators/log.decorator.js';
import { recordActivity } from '../../shared/decorators/activity.decorator.js';

export const CEFR_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export class StudentTestService {
  /**
   * Submit a test, evaluate answers, update FAME-KT Elo, and save results.
   */
  @logExecution()
  @recordActivity("USER_SUBMIT_TEST", (res, userId, testId) => `Học viên ID ${userId} nộp bài kiểm tra ID ${testId} đạt ${res.totalScore} điểm`)
  async submitTest(
    userId: number,
    testId: number,
    submissions: { questionId: number; selectedAnswerId?: number; textAnswer?: string; timeTakenMs: number }[]
  ) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        lesson: {
          include: {
            topic: true,
          },
        },
        questions: {
          include: { answers: true }
        }
      }
    });

    if (!test) throw new ApiError(404, "test_not_found", "Không tìm thấy bài kiểm tra");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "user_not_found", "Không tìm thấy người dùng");

    // 1. KIỂM TRA CHÊNH LỆCH TRÌNH ĐỘ (Level Mismatch Gating)
    const testCefr = test.ceftLevel || test.lesson?.cefrLevel;
    if (testCefr && user.cefrLevel) {
      const userRank = CEFR_ORDER[user.cefrLevel.toUpperCase()] || 1;
      const testRank = CEFR_ORDER[testCefr.toUpperCase()] || 1;
      if (testRank - userRank > 1) {
        throw new ApiError(
          403,
          "level_mismatch",
          `Trình độ hiện tại (${user.cefrLevel}) không đủ điều kiện làm bài thi cấp độ ${testCefr}. Thí sinh không thể nhảy cóc vượt cấp.`
        );
      }
    }

    // 2. KIỂM TRA PHẠM VI CHỦ ĐỀ (Cross-Topic Access Control)
    if (test.lesson && test.lesson.topicId && user.preferredTopics) {
      const enrolledTopicIds = user.preferredTopics
        .split(',')
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n));
      if (enrolledTopicIds.length > 0 && !enrolledTopicIds.includes(test.lesson.topicId)) {
        throw new ApiError(
          403,
          "topic_access_denied",
          "Bạn không thể truy cập hoặc nộp bài thi của chủ đề (Topic) khác ngoài lộ trình đã đăng ký."
        );
      }
    }

    // LỖ HỔNG 1: ANTI-FARMING (Ngăn chặn làm lại bài để cày XP/Elo)
    const existingResult = await prisma.userTestResult.findFirst({
      where: { userId, testId }
    });
    const isRetake = Boolean(existingResult);


    let totalScore = 0;
    let newGrammarElo = user.grammarElo;
    let newVocabElo = user.vocabElo;
    let newReadingElo = user.readingElo;
    let newListeningElo = user.listeningElo;

    const assessmentHistories: any[] = [];
    let correctCount = 0;

    for (const sub of submissions) {
      const q = test.questions.find(x => x.id === sub.questionId);
      if (!q) continue;

      let isCorrect = false;
      const correctAns = q.answers.find(a => a.isCorrect);

      if (q.questionType === 'multiple_choice' || (q.questionType === 'listening' && sub.selectedAnswerId)) {
        if (correctAns && correctAns.id === sub.selectedAnswerId) {
          isCorrect = true;
        }
      } else if (q.questionType === 'fill_in_blank') {
        if (correctAns && sub.textAnswer) {
          const cleanUserAns = sub.textAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
          const cleanCorrectAns = correctAns.answerText.trim().toLowerCase().replace(/[.,!?;:]/g, '');
          if (cleanUserAns === cleanCorrectAns) {
            isCorrect = true;
          }
        }
      } else if (q.questionType === 'writing' || q.questionType === 'speaking') {
        // Kiểm tra điểm từ AI đánh giá hoặc so sánh với đáp án chuẩn
        if (correctAns && sub.textAnswer) {
          const cleanUserAns = sub.textAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
          const cleanCorrectAns = correctAns.answerText.trim().toLowerCase().replace(/[.,!?;:]/g, '');
          if (cleanUserAns === cleanCorrectAns) {
            isCorrect = true;
          }
        }
        
        // Nếu có điểm AI đính kèm từ luồng làm bài thực hành
        if (!isCorrect && sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
          const match = sub.textAnswer.match(/\[Điểm AI:\s*(\d+)%\]/);
          if (match) {
            const scorePercent = parseInt(match[1], 10);
            // Chỉ công nhận đạt nếu điểm AI >= 60 và nội dung trả lời thực tế có độ dài hợp lệ (> 3 ký tự)
            const actualText = sub.textAnswer.replace(/\[Điểm AI:\s*\d+%\]/, '').replace(/\(Nói:[^)]*\)/, '').trim();
            if (scorePercent >= 60 && (actualText.length >= 3 || sub.textAnswer.includes('(Nói:'))) {
              isCorrect = true;
            }
          }
        }
      }

      if (isCorrect) {
        totalScore += Number(q.points || 10);
        correctCount++;
      }

      // FAME-KT ELO LOGIC: Tích hợp IRT Guessing Factor & Psychometrics Time Factor
      const timeTakenMs = sub.timeTakenMs || 5000;
      let eloTarget = newVocabElo;
      const skillCat = q.skillCategory || 'Vocabulary';

      if (skillCat === 'Grammar') eloTarget = newGrammarElo;
      else if (skillCat === 'Reading') eloTarget = newReadingElo;
      else if (skillCat === 'Listening') eloTarget = newListeningElo;
      else eloTarget = newVocabElo;

      // c_guessing = 0.25 cho trắc nghiệm, 0.05 cho tự luận/viết
      const c_guessing = (q.questionType === 'multiple_choice' || q.questionType === 'listening') ? 0.25 : 0.05;

      const { newUserElo } = updateAdvancedElo(
        eloTarget,
        q.difficultyElo || 1200,
        isCorrect,
        timeTakenMs,
        c_guessing
      );

      // Cập nhật lại vào biến Elo tương ứng
      if (skillCat === 'Grammar') newGrammarElo = newUserElo;
      else if (skillCat === 'Reading') newReadingElo = newUserElo;
      else if (skillCat === 'Listening') newListeningElo = newUserElo;
      else newVocabElo = newUserElo;

      const avgEloAfter = Math.round((newGrammarElo + newVocabElo + newReadingElo + newListeningElo) / 4);

      assessmentHistories.push({
        userId,
        questionId: q.id,
        isCorrect,
        timeTakenMs,
        avgEloAfter,
        userAnswer: sub.textAnswer || (sub.selectedAnswerId ? sub.selectedAnswerId.toString() : null)
      });
    }

    // Save records in transaction
    const xpGained = correctCount * 10;

    await prisma.$transaction(async (tx) => {
      // 1. Save Test Result
      await tx.userTestResult.create({
        data: {
          userId,
          testId,
          totalScore: totalScore
        }
      });

      // 2. Save Assessment History
      if (assessmentHistories.length > 0) {
        await tx.assessmentHistory.createMany({
          data: assessmentHistories
        });
      }

      // 3. Update User Elo & XP (Chỉ cập nhật nếu KHÔNG PHẢI retake)
      if (!isRetake) {
        const avgElo = Math.round((newGrammarElo + newVocabElo + newReadingElo + newListeningElo) / 4);
        const newCefr = getCEFRLevel(avgElo);

        await tx.user.update({
          where: { id: userId },
          data: {
            grammarElo: newGrammarElo,
            vocabElo: newVocabElo,
            readingElo: newReadingElo,
            listeningElo: newListeningElo,
            cefrLevel: newCefr,
            xpPoints: { increment: xpGained }
          }
        });

        if (user.cefrLevel && user.cefrLevel !== newCefr) {
          notificationService.notifyAdmins(
            "Học viên thăng hạng trình độ 🚀",
            `Học viên ${user.username} vừa thăng hạng từ ${user.cefrLevel} lên ${newCefr} sau khi hoàn thành bài thi "${test.title}".`
          ).catch(() => {});
        }
      }
    });

    // Tự động quét thành tựu
    await achievementEvaluator.evaluateUserAchievements(userId);

    const actualXpGained = isRetake ? 0 : xpGained;

    return {
      totalScore,
      correctCount,
      totalQuestions: test.questions.length,
      xpGained: actualXpGained,
      isRetake,
      newElo: {
        grammar: newGrammarElo,
        vocab: newVocabElo,
        reading: newReadingElo,
        listening: newListeningElo
      }
    };
  }

  @logExecution()
  async getTestDetail(testId: number, userId?: number) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        lesson: {
          include: {
            topic: true,
          },
        },
        questions: {
          include: {
            answers: {
              select: { id: true, answerText: true } // Do NOT send isCorrect to client!
            }
          }
        }
      }
    });
    if (!test) throw new ApiError(404, "test_not_found", "Không tìm thấy bài kiểm tra");

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        // 1. Kiểm tra chênh lệch trình độ khi mở bài thi
        const testCefr = test.ceftLevel || test.lesson?.cefrLevel;
        if (testCefr && user.cefrLevel) {
          const userRank = CEFR_ORDER[user.cefrLevel.toUpperCase()] || 1;
          const testRank = CEFR_ORDER[testCefr.toUpperCase()] || 1;
          if (testRank - userRank > 1) {
            throw new ApiError(
              403,
              "level_mismatch",
              `Trình độ hiện tại (${user.cefrLevel}) không đủ điều kiện làm bài thi cấp độ ${testCefr}. Thí sinh không thể nhảy cóc vượt cấp.`
            );
          }
        }

        // 2. Kiểm tra quyền truy cập phạm vi chủ đề
        if (test.lesson && test.lesson.topicId && user.preferredTopics) {
          const enrolledTopicIds = user.preferredTopics
            .split(',')
            .map((s: string) => parseInt(s.trim(), 10))
            .filter((n: number) => !isNaN(n));
          if (enrolledTopicIds.length > 0 && !enrolledTopicIds.includes(test.lesson.topicId)) {
            throw new ApiError(
              403,
              "topic_access_denied",
              "Bạn không thể truy cập hoặc nộp bài thi của chủ đề (Topic) khác ngoài lộ trình đã đăng ký."
            );
          }
        }
      }
    }

    return test;
  }
}

export const studentTestService = new StudentTestService();
