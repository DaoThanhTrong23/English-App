import { shuffleArray } from '../../utils/array.js';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/prisma.js';
import { updateAdvancedElo, getCEFRLevel, createNewUserProficiency, recommendPersonalizedPath, UserProficiency, checkEarlyStop, FAME_KT_CONFIG } from './fame-kt.js';
import { keywordSettingService } from '../keyword-setting/keyword-setting.service.js';
import { notificationService } from '../notification/notification.service.js';

export class OnboardingService {
  private questionBank: any[] = [];

  constructor() {
    this.loadQuestionBank();
  }

    async loadQuestionBank() {
    try {
      // 1. Ưu tiên nạp từ Database để Admin có thể thêm/xóa/sửa trực tiếp trên trang quản trị
      const dbQuestions = await prisma.question.findMany({
        where: {
          test: {
            lessonId: null,
            title: { contains: "phân loại đầu vào" }
          }
        },
        include: { answers: true, test: true },
        orderBy: { id: "asc" }
      });

      if (dbQuestions && dbQuestions.length > 0) {
        this.questionBank = dbQuestions.map(q => {
          const correctAns = q.answers.find(a => a.isCorrect)?.answerText || (q.answers[0]?.answerText || "");
          return {
            id: q.id.toString(),
            question: q.quesionText,
            options: q.answers.map(a => a.answerText),
            correct: correctAns,
            difficultyElo: q.difficultyElo || 1200,
            skillCategory: q.skillCategory || "Grammar",
            topic: q.topic || "General English",
            cefr: q.test?.ceftLevel || "A1"
          };
        });
        console.log(`Đã nạp thành công ${this.questionBank.length} câu hỏi phân loại đầu vào từ Database!`);
        return;
      }
    } catch (e) {
      console.warn("Chưa lấy được câu hỏi từ DB, dùng fallback JSON:", e);
    }

    try {
      const filePath = path.resolve(process.cwd(), 'uploads/questionBank_full.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.questionBank = JSON.parse(data);
        console.log(`Đã load thành công ${this.questionBank.length} câu hỏi từ questionBank_full.json!`);
      } else {
        console.warn('Không tìm thấy questionBank_full.json');
      }
    } catch (e) {
      console.error('Lỗi khi load question bank:', e);
    }
  }

  async getPlacementQuestions() {
    await this.loadQuestionBank();
    
    const count = FAME_KT_CONFIG.TEST_SETTINGS.PLACEMENT_QUESTIONS_COUNT || 15;
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const perLevel = Math.max(1, Math.floor(count / levels.length)); // 3 câu mỗi cấp độ

    const selectedQuestions: any[] = [];
    const globalSkillCounts: Record<string, number> = { Grammar: 0, Vocabulary: 0, Reading: 0, Listening: 0 };

    // Chọn đều theo từng cấp độ CEFR và cân bằng chuẩn 4 kỹ năng
    levels.forEach(lvl => {
      const levelQuestions = this.questionBank.filter(q => q.cefr === lvl);
      if (levelQuestions.length > 0) {
        // Xáo trộn ngẫu nhiên trước để tạo sự đa dạng
        const shuffled = shuffleArray(levelQuestions);
        // Sắp xếp ưu tiên các kỹ năng đang có ít câu hỏi nhất trong đề
        shuffled.sort((a, b) => (globalSkillCounts[a.skillCategory] || 0) - (globalSkillCounts[b.skillCategory] || 0));

        const chosen: any[] = [];
        const usedSkills = new Set<string>();

        // Ưu tiên chọn các câu thuộc các kỹ năng khác nhau trong cùng bậc
        for (const q of shuffled) {
          if (!usedSkills.has(q.skillCategory) && chosen.length < perLevel) {
            chosen.push(q);
            usedSkills.add(q.skillCategory);
            globalSkillCounts[q.skillCategory] = (globalSkillCounts[q.skillCategory] || 0) + 1;
          }
        }
        // Nếu chưa đủ số lượng của bậc đó, lấy thêm từ các câu còn lại
        for (const q of shuffled) {
          if (chosen.length < perLevel && !chosen.some(c => c.id === q.id)) {
            chosen.push(q);
            globalSkillCounts[q.skillCategory] = (globalSkillCounts[q.skillCategory] || 0) + 1;
          }
        }
        selectedQuestions.push(...chosen);
      }
    });

    // Nếu chưa đủ count, bổ sung từ các câu còn lại trong ngân hàng
    if (selectedQuestions.length < count) {
      const remaining = this.questionBank.filter(q => !selectedQuestions.some(s => s.id === q.id));
      const extra = shuffleArray(remaining).slice(0, count - selectedQuestions.length);
      selectedQuestions.push(...extra);
    }

    const finalSet = shuffleArray(selectedQuestions.slice(0, count));

    return finalSet.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      skillCategory: q.skillCategory,
      topic: q.topic,
      audioText: q.audioText || null,
      cefr: q.cefr
    }));
  }

  
  async checkProgress(userAnswers: { id: string, answer: string, timeTakenMs?: number }[]) {
    await this.loadQuestionBank();
    let userProficiency = createNewUserProficiency();
    let avgEloHistory: number[] = [];
    let stoppedEarly = false;

    for (const ans of userAnswers) {
      const q = this.questionBank.find((x) => x.id.toString() === ans.id.toString());
      if (q) {
        const isCorrect = q.correct === ans.answer;
        const timeTakenMs = ans.timeTakenMs || FAME_KT_CONFIG.TEST_SETTINGS.DEFAULT_SIMULATED_TIME_MS;
        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const { newUserElo } = updateAdvancedElo(
          userProficiency[skill], 
          q.difficultyElo || FAME_KT_CONFIG.ELO.DEFAULT_QUESTION_ELO, 
          isCorrect, 
          timeTakenMs
        );
        userProficiency[skill] = newUserElo;

        const currentAvgElo = Object.values(userProficiency).reduce((a, b) => a + b, 0) / 4;
        avgEloHistory.push(currentAvgElo);

        if (checkEarlyStop(avgEloHistory, FAME_KT_CONFIG.EARLY_STOP.MIN_QUESTIONS)) {
          stoppedEarly = true;
          break;
        }
      }
    }
    return { stoppedEarly };
  }

  async processOnboarding(userId: number, job: string, interests: string, userAnswers: { id: string, answer: string, timeTakenMs?: number }[]) {
    await this.loadQuestionBank();
    // 1. Khởi tạo năng lực người dùng theo thuật toán FAME-KT
    let userProficiency = createNewUserProficiency();
    let totalScore = 0;

    // 2. Chạy thuật toán IRT & Elo trên từng câu hỏi
    
    let questionsUsed = 0;
    let stoppedEarly = false;
    let avgEloHistory: number[] = [];

    const questionEloUpdates: { id: number; newElo: number }[] = [];
    const assessmentHistoryRecords: any[] = [];

    for (const ans of userAnswers) {
      const q = this.questionBank.find((x) => x.id.toString() === ans.id.toString());
      if (q) {
        const isCorrect = q.correct === ans.answer;
        if (isCorrect) totalScore++;

        const timeTakenMs = ans.timeTakenMs || FAME_KT_CONFIG.TEST_SETTINGS.DEFAULT_SIMULATED_TIME_MS;

        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const userEloForSkill = userProficiency[skill];
        const questionElo = q.difficultyElo || FAME_KT_CONFIG.ELO.DEFAULT_QUESTION_ELO;

        // FAME-KT: Cập nhật đồng thời Năng lực học viên và Độ khó câu hỏi với Diagnostic K-factor
        const kDiag = (FAME_KT_CONFIG.ELO as any).K_DIAGNOSTIC || 75;
        const { newUserElo, newQuestionElo } = updateAdvancedElo(
          userEloForSkill, 
          questionElo, 
          isCorrect, 
          timeTakenMs,
          FAME_KT_CONFIG.IRT.DEFAULT_GUESSING_PROBABILITY,
          kDiag
        );
        
        userProficiency[skill] = newUserElo;
        questionsUsed++;

        // Lưu lại Elo trung bình để xét điều kiện dừng sớm
        const currentAvgElo = Math.round(Object.values(userProficiency).reduce((a, b) => a + b, 0) / 4);
        avgEloHistory.push(currentAvgElo);

        // Thu thập thông tin cập nhật độ khó câu hỏi và ghi nhận khảo thí
        const qNumId = Number(q.id);
        if (!isNaN(qNumId) && qNumId > 0) {
          questionEloUpdates.push({ id: qNumId, newElo: newQuestionElo });
          q.difficultyElo = newQuestionElo; // Đồng bộ tức thì trong memory cache

          assessmentHistoryRecords.push({
            userId,
            questionId: qNumId,
            isCorrect,
            timeTakenMs,
            userAnswer: typeof ans.answer === 'string' ? ans.answer : String(ans.answer || ''),
            avgEloAfter: currentAvgElo
          });
        }

        // Kích hoạt Cải tiến 4: Tự động dừng
        if (checkEarlyStop(avgEloHistory, FAME_KT_CONFIG.EARLY_STOP.MIN_QUESTIONS)) {
          stoppedEarly = true;
          break; // Dừng việc chấm điểm các câu còn lại do năng lực đã hội tụ
        }
      }
    }

    // Thực thi Online Real-time Update vào Database & Ghi nhận AssessmentHistory
    if (questionEloUpdates.length > 0) {
      try {
        const validQuestionIds = (await prisma.question.findMany({
          where: { id: { in: questionEloUpdates.map(u => u.id) } },
          select: { id: true }
        })).map(item => item.id);

        const dbOps: any[] = questionEloUpdates
          .filter(u => validQuestionIds.includes(u.id))
          .map(u => prisma.question.update({
            where: { id: u.id },
            data: { difficultyElo: u.newElo }
          }));

        const validHistories = assessmentHistoryRecords.filter(r => validQuestionIds.includes(r.questionId));
        if (validHistories.length > 0) {
          dbOps.push(prisma.assessmentHistory.createMany({ data: validHistories }));
        }

        await Promise.all(dbOps);
      } catch (err) {
        console.error('Lỗi cập nhật Elo câu hỏi hoặc lưu lịch sử khảo thí:', err);
      }
    }
  

    // 3. Tính CEFR tổng quát (Lấy trung bình Elo)
    const avgElo = Math.round(
      Object.values(userProficiency).reduce((a, b) => a + b, 0) / Object.keys(userProficiency).length
    );
    const cefrLevel = getCEFRLevel(avgElo);

    // Xử lý Interests và mở rộng từ khóa đồng nghĩa từ synonyms.csv
    const userTopics = interests.split(',').map(x => x.trim()).filter(Boolean);
    const synonymDict = keywordSettingService.getSynonymDict();
    const expandedKeywords = new Set<string>();

    userTopics.forEach((t: string) => {
      const syns = synonymDict[t.toLowerCase()];
      if (syns) {
        syns.forEach(s => expandedKeywords.add(s.toLowerCase()));
      } else {
        expandedKeywords.add(t.toLowerCase());
      }
    });

    // 4. Lấy bài học trong Database để Recommender hệ thống FAME-KT đánh giá
    const allCoursesDB = await prisma.topic.findMany({ include: { lessons: true } });
    
    const algoCourses = allCoursesDB.map((c, idx) => {
      const titleLower = (c.title || '').toLowerCase();
      const descLower = (c.description || '').toLowerCase();
      
      // Suy luận kỹ năng chủ đạo của chủ đề
      let skillCategory: keyof UserProficiency = 'Vocabulary';
      if (titleLower.includes('ngữ pháp') || titleLower.includes('grammar') || descLower.includes('ngữ pháp')) {
        skillCategory = 'Grammar';
      } else if (titleLower.includes('nghe') || titleLower.includes('listening') || descLower.includes('nghe')) {
        skillCategory = 'Listening';
      } else if (titleLower.includes('đọc') || titleLower.includes('reading') || descLower.includes('đọc')) {
        skillCategory = 'Reading';
      } else {
        // Phân bổ đều cho các chủ đề chung
        const skills: (keyof UserProficiency)[] = ['Vocabulary', 'Grammar', 'Reading', 'Listening'];
        skillCategory = skills[idx % skills.length];
      }

      return {
        id: c.id.toString(),
        title: c.title,
        cefr: c.cefrLevel || 'A1',
        topic: c.description || c.title,
        skillCategory,
        dbModel: c
      };
    });

    const recommended = recommendPersonalizedPath(userProficiency, userTopics, algoCourses, expandedKeywords);
    
    const recommendedCourses = recommended.slice(0, FAME_KT_CONFIG.RECOMMENDER.RECOMMENDED_COURSES_LIMIT).map(r => (r as any).dbModel);

    let finalCourses = recommendedCourses;
    if (finalCourses.length === 0) {
      finalCourses = await prisma.topic.findMany({ take: FAME_KT_CONFIG.RECOMMENDER.RECOMMENDED_COURSES_LIMIT });
    }

    const preferredTopics = finalCourses.map((c: any) => c.id).join(',');

    // 5. Cập nhật vào DB đầy đủ 4 trường Elo, CEFR và chủ đề học chính ban đầu
    await prisma.user.update({
      where: { id: userId },
      data: {
        job: job || '',
        interests: interests || '',
        cefrLevel: cefrLevel,
        grammarElo: userProficiency.Grammar,
        vocabElo: userProficiency.Vocabulary,
        readingElo: userProficiency.Reading,
        listeningElo: userProficiency.Listening,
        preferredTopics: preferredTopics,
        onboardingCompleted: true
      }
    });

    // Thông báo cho Quản trị viên
    prisma.user.findUnique({ where: { id: userId }, select: { username: true } }).then(u => {
      if (u) {
        notificationService.notifyAdmins(
          "Học viên được xếp hạng trình độ",
          `Học viên ${u.username} đã hoàn thành bài đánh giá năng lực và đạt trình độ ${cefrLevel}.`
        ).catch(() => {});
      }
    }).catch(() => {});

    return {
      cefrLevel,
      eloProfile: userProficiency,
      score: `${totalScore}/${questionsUsed}`, stoppedEarly, questionsUsed,
      recommendedCourses: finalCourses
    };
  }
}

export const onboardingService = new OnboardingService();
