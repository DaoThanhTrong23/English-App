import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/prisma.js';
import { updateAdvancedElo, getCEFRLevel, createNewUserProficiency, recommendPersonalizedPath, UserProficiency } from './fame-kt.js';

export class OnboardingService {
  private questionBank: any[] = [];

  constructor() {
    this.loadQuestionBank();
  }

  private loadQuestionBank() {
    try {
      const filePath = path.resolve(__dirname, '../../../../adaptive-algo-demo/src/data/questionBank.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.questionBank = JSON.parse(data);
      } else {
        console.warn('⚠️ Không tìm thấy questionBank.json, sử dụng data giả lập.');
        this.questionBank = this.getMockQuestions();
      }
    } catch (e) {
      console.error('Error loading question bank', e);
      this.questionBank = this.getMockQuestions();
    }
  }

  async getPlacementQuestions() {
    if (!this.questionBank || this.questionBank.length === 0) {
      this.loadQuestionBank();
    }
    
    // Lấy ngẫu nhiên 10 câu (có thể cải tiến thành lấy câu Adaptive nếu test dài hơn)
    const shuffled = this.questionBank.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      skillCategory: q.skillCategory,
      topic: q.topic
    }));
  }

  async processOnboarding(userId: number, job: string, interests: string, userAnswers: { id: string, answer: string, timeTakenMs?: number }[]) {
    // 1. Khởi tạo năng lực người dùng theo thuật toán FAME-KT
    let userProficiency = createNewUserProficiency();
    let totalScore = 0;

    // 2. Chạy thuật toán IRT & Elo trên từng câu hỏi
    userAnswers.forEach(ans => {
      const q = this.questionBank.find((x) => x.id === ans.id);
      if (q) {
        const isCorrect = q.correct === ans.answer;
        if (isCorrect) totalScore++;

        const timeTakenMs = ans.timeTakenMs || (Math.random() * 10000 + 5000); // Giả lập 5-15s nếu Client chưa gửi

        // Phân loại kỹ năng
        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const userEloForSkill = userProficiency[skill];
        const questionElo = q.difficultyElo || 1200;

        // Cập nhật bằng hàm Advanced Elo
        const { newUserElo } = updateAdvancedElo(userEloForSkill, questionElo, isCorrect, timeTakenMs);
        
        // Lưu lại Elo mới
        userProficiency[skill] = newUserElo;
      }
    });

    // 3. Tính CEFR tổng quát (Lấy trung bình Elo hoặc Elo của kỹ năng yếu nhất)
    const avgElo = Math.round(
      Object.values(userProficiency).reduce((a, b) => a + b, 0) / Object.keys(userProficiency).length
    );
    const cefrLevel = getCEFRLevel(avgElo);

    // Xử lý Interests (chuyển String thành mảng Topic)
    const userTopics = interests.split(',').map(x => x.trim());

    // 4. Lấy tất cả bài học trong Database để Recommender hệ thống FAME-KT đánh giá
    const allCoursesDB = await prisma.topic.findMany({ include: { lessons: true } });
    
    // Map về định dạng Lesson của thuật toán
    const algoCourses = allCoursesDB.map(c => ({
      id: c.id.toString(),
      title: c.title,
      cefr: c.cefrLevel || 'A1',
      topic: c.description || 'General',
      skillCategory: 'Grammar' as keyof UserProficiency, // Giả sử Course focus vào Grammar, có thể cải tiến DB để lưu skillCategory
      dbModel: c
    }));

    // Chạy Recommendation 
    const recommended = recommendPersonalizedPath(userProficiency, userTopics, algoCourses);
    
    // Lấy top 3 Course thực tế
    const recommendedCourses = recommended.slice(0, 3).map(r => (r as any).dbModel);

    // Nếu Recommended rỗng (DB ít data), fallback lấy random
    let finalCourses = recommendedCourses;
    if (finalCourses.length === 0) {
      finalCourses = await prisma.topic.findMany({ take: 3 });
    }

    // 5. Cập nhật vào DB (Lưu trữ profiency nếu cần, tạm lưu CEFR tổng quát)
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
      score: `${totalScore}/${userAnswers.length}`,
      recommendedCourses: finalCourses
    };
  }

  private getMockQuestions() {
    return [
      { id: "q1", question: "I ___ a student.", options: ["am", "is", "are", "be"], correct: "am", difficultyElo: 900, skillCategory: 'Grammar', topic: 'Daily' },
      { id: "q2", question: "She ___ to the store.", options: ["go", "goes", "going", "gone"], correct: "goes", difficultyElo: 1100, skillCategory: 'Grammar', topic: 'Daily' },
      { id: "q3", question: "They ___ playing football.", options: ["am", "is", "are", "be"], correct: "are", difficultyElo: 1300, skillCategory: 'Grammar', topic: 'Sports' }
    ];
  }
}

export const onboardingService = new OnboardingService();
