import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/prisma.js';
import { updateAdvancedElo, getCEFRLevel, createNewUserProficiency, recommendPersonalizedPath, UserProficiency, checkEarlyStop } from './fame-kt.js';

export class OnboardingService {
  private questionBank: any[] = [];

  constructor() {
    this.loadQuestionBank();
  }

    private loadQuestionBank() {
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
    if (!this.questionBank || this.questionBank.length === 0) {
      this.loadQuestionBank();
    }
    
    // Lấy ngẫu nhiên 10 câu để làm test
    const shuffled = [...this.questionBank].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 15).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      skillCategory: q.skillCategory,
      topic: q.topic
    }));
  }

  
  async checkProgress(userAnswers: { id: string, answer: string, timeTakenMs?: number }[]) {
    let userProficiency = createNewUserProficiency();
    let avgEloHistory: number[] = [];
    let stoppedEarly = false;

    for (const ans of userAnswers) {
      const q = this.questionBank.find((x) => x.id === ans.id);
      if (q) {
        const isCorrect = q.correct === ans.answer;
        const timeTakenMs = ans.timeTakenMs || 8000;
        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const { newUserElo } = updateAdvancedElo(userProficiency[skill], q.difficultyElo || 1200, isCorrect, timeTakenMs);
        userProficiency[skill] = newUserElo;

        const currentAvgElo = Object.values(userProficiency).reduce((a, b) => a + b, 0) / 4;
        avgEloHistory.push(currentAvgElo);

        if (checkEarlyStop(avgEloHistory, 6)) {
          stoppedEarly = true;
          break;
        }
      }
    }
    return { stoppedEarly };
  }

  async processOnboarding(userId: number, job: string, interests: string, userAnswers: { id: string, answer: string, timeTakenMs?: number }[]) {
    // 1. Khởi tạo năng lực người dùng theo thuật toán FAME-KT
    let userProficiency = createNewUserProficiency();
    let totalScore = 0;

    // 2. Chạy thuật toán IRT & Elo trên từng câu hỏi
    
    let questionsUsed = 0;
    let stoppedEarly = false;
    let avgEloHistory: number[] = [];

    for (const ans of userAnswers) {
      const q = this.questionBank.find((x) => x.id === ans.id);
      if (q) {
        const isCorrect = q.correct === ans.answer;
        if (isCorrect) totalScore++;

        const timeTakenMs = ans.timeTakenMs || (Math.random() * 10000 + 5000);

        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const userEloForSkill = userProficiency[skill];
        const questionElo = q.difficultyElo || 1200;

        const { newUserElo } = updateAdvancedElo(userEloForSkill, questionElo, isCorrect, timeTakenMs);
        
        userProficiency[skill] = newUserElo;
        questionsUsed++;

        // Lưu lại Elo trung bình để xét điều kiện dừng sớm
        const currentAvgElo = Object.values(userProficiency).reduce((a, b) => a + b, 0) / 4;
        avgEloHistory.push(currentAvgElo);

        // Kích hoạt Cải tiến 4: Tự động dừng
        if (checkEarlyStop(avgEloHistory, 6)) {
          stoppedEarly = true;
          break; // Dừng việc chấm điểm các câu còn lại do năng lực đã hội tụ
        }
      }
    }
  

    // 3. Tính CEFR tổng quát (Lấy trung bình Elo)
    const avgElo = Math.round(
      Object.values(userProficiency).reduce((a, b) => a + b, 0) / Object.keys(userProficiency).length
    );
    const cefrLevel = getCEFRLevel(avgElo);

    // Xử lý Interests 
    const userTopics = interests.split(',').map(x => x.trim());

    // 4. Lấy bài học trong Database để Recommender hệ thống FAME-KT đánh giá
    const allCoursesDB = await prisma.topic.findMany({ include: { lessons: true } });
    
    const algoCourses = allCoursesDB.map(c => ({
      id: c.id.toString(),
      title: c.title,
      cefr: c.cefrLevel || 'A1',
      topic: c.description || 'General',
      skillCategory: 'Grammar' as keyof UserProficiency, 
      dbModel: c
    }));

    const recommended = recommendPersonalizedPath(userProficiency, userTopics, algoCourses);
    
    const recommendedCourses = recommended.slice(0, 3).map(r => (r as any).dbModel);

    let finalCourses = recommendedCourses;
    if (finalCourses.length === 0) {
      finalCourses = await prisma.topic.findMany({ take: 3 });
    }

    // 5. Cập nhật vào DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        job: job || '',
        interests: interests || '',
        cefrLevel: cefrLevel,
        onboardingCompleted: true
      }
    });

    return {
      cefrLevel,
      eloProfile: userProficiency,
      score: `${totalScore}/${questionsUsed}`, stoppedEarly, questionsUsed,
      recommendedCourses: finalCourses
    };
  }
}

export const onboardingService = new OnboardingService();
