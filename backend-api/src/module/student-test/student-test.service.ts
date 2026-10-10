import { achievementEvaluator } from '../achievement/achievement.evaluator.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/http/api-error.js';

export class StudentTestService {
  /**
   * Submit a test, evaluate answers, update FAME-KT Elo, and save results.
   */
  async submitTest(
    userId: number,
    testId: number,
    submissions: { questionId: number; selectedAnswerId?: number; textAnswer?: string; timeTakenMs: number }[]
  ) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { answers: true }
        }
      }
    });

    if (!test) throw new ApiError(404, "test_not_found", "Không tìm thấy bài kiểm tra");

    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "user_not_found", "Không tìm thấy người dùng");

    // LỖ HỔNG 1: ANTI-FARMING (Ngăn chặn làm lại bài để cày XP/Elo)
    const existingResult = await prisma.userTestResult.findFirst({
      where: { userId, testId }
    });
    const isRetake = Boolean(existingResult);


    let totalScore = 0;
    let newGrammarElo = user.grammarElo;
    let newVocabElo = user.vocabElo;
    let newReadingElo = user.readingElo;

    const assessmentHistories: any[] = [];
    let correctCount = 0;

    for (const sub of submissions) {
      const q = test.questions.find(x => x.id === sub.questionId);
      if (!q) continue;

      let isCorrect = false;
        if (q.questionType === 'multiple_choice' || q.questionType === 'listening') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns && correctAns.id === sub.selectedAnswerId) {
            isCorrect = true;
          }
        } else if (q.questionType === 'fill_in_blank' || q.questionType === 'writing') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\[Điểm AI:\s*(\d+)%\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          } else if (correctAns) {
            if (sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
              isCorrect = true;
            }
          } else if (sub.textAnswer && sub.textAnswer.trim().length > 0) {
            isCorrect = true;
          }
        } else if (q.questionType === 'speaking') {
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\[Điểm AI:\s*(\d+)%\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          }
        }

      if (isCorrect) {
        totalScore += Number(q.points || 10);
        correctCount++;
      }

      // FAME-KT ELO LOGIC (Rapid Guessing Threshold: 2s)
      let eloTarget = newVocabElo;
      if (q.skillCategory === 'Grammar') eloTarget = newGrammarElo;
      if (q.skillCategory === 'Reading') eloTarget = newReadingElo;

      const timeS = (sub.timeTakenMs || 5000) / 1000;
      // Filter Rapid-guessing: if time < 2s, we do NOT penalize them if wrong, or reward if right (it's just a guess)
      if (timeS >= 2.0) {
        const expectedScore = 1 / (1 + Math.pow(10, (q.difficultyElo - eloTarget) / 400));
        const actualScore = isCorrect ? 1 : 0;
        
        // K factor: dynamic based on time? Default K=32
        const K = 32;
        const eloChange = Math.round(K * (actualScore - expectedScore));
        
        eloTarget += eloChange;

        // Apply back
        if (q.skillCategory === 'Grammar') newGrammarElo = eloTarget;
        else if (q.skillCategory === 'Reading') newReadingElo = eloTarget;
        else newVocabElo = eloTarget;
      }

      const avgEloAfter = Math.round((newGrammarElo + newVocabElo + newReadingElo) / 3);

      assessmentHistories.push({
          userId,
          questionId: q.id,
          isCorrect,
          timeTakenMs: sub.timeTakenMs || 5000,
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

      // 3. Update User Elo & XP
      
      
      // Update User Elo & XP (Chỉ cập nhật nếu KHÔNG PHẢI retake)
      if (!isRetake) {
        const avgElo = Math.round((newGrammarElo + newVocabElo + newReadingElo) / 3);
        let newCefr = user.cefrLevel;
        if (avgElo < 1100) newCefr = 'A1';
        else if (avgElo < 1300) newCefr = 'A2';
        else if (avgElo < 1500) newCefr = 'B1';
        else if (avgElo < 1700) newCefr = 'B2';
        else if (avgElo < 1900) newCefr = 'C1';
        else newCefr = 'C2';

        await tx.user.update({
          where: { id: userId },
          data: {
            grammarElo: newGrammarElo,
            vocabElo: newVocabElo,
            readingElo: newReadingElo,
            cefrLevel: newCefr,
            xpPoints: { increment: xpGained }
          }
        });
      }


    });

    // Tự động quét thành tựu
    await achievementEvaluator.evaluateUserAchievements(userId);

    return {
      totalScore,
      correctCount,
      totalQuestions: test.questions.length,
      xpGained,
      newElo: {
        grammar: newGrammarElo,
        vocab: newVocabElo,
        reading: newReadingElo
      }
    };
  }

  async getTestDetail(testId: number) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
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
    return test;
  }
}

export const studentTestService = new StudentTestService();
