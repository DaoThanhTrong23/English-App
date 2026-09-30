import { prisma } from '../../config/prisma.js';
import { updateAdvancedElo, getCEFRLevel, createNewUserProficiency, recommendPersonalizedPath, UserProficiency } from './fame-kt.js';

export class OnboardingService {
  private questionBank: any[] = [];

  constructor() {
    this.loadQuestionBank();
  }

  private loadQuestionBank() {
    // Hardcode 20 câu hỏi chất lượng phân bổ các cấp độ và kỹ năng
    // Điều này giúp thuật toán Adaptive chạy chuẩn mà không cần load file CSV lỗi
    this.questionBank = [
      { id: "q1", question: "I ___ a student at the local university.", options: ["am", "is", "are", "be"], correct: "am", difficultyElo: 900, skillCategory: 'Grammar', topic: 'Daily' },
      { id: "q2", question: "She usually ___ to the gym on weekends.", options: ["go", "goes", "going", "gone"], correct: "goes", difficultyElo: 1100, skillCategory: 'Grammar', topic: 'Daily' },
      { id: "q3", question: "We ___ playing football when it started to rain.", options: ["was", "are", "were", "been"], correct: "were", difficultyElo: 1250, skillCategory: 'Grammar', topic: 'Sports' },
      { id: "q4", question: "If I ___ you, I would study harder.", options: ["am", "was", "were", "be"], correct: "were", difficultyElo: 1400, skillCategory: 'Grammar', topic: 'Education' },
      { id: "q5", question: "By the time we arrived, the movie ___.", options: ["has started", "started", "had started", "starting"], correct: "had started", difficultyElo: 1500, skillCategory: 'Grammar', topic: 'Entertainment' },
      
      { id: "q6", question: "The company's profits have ___ significantly this quarter.", options: ["risen", "rose", "raised", "arisen"], correct: "risen", difficultyElo: 1450, skillCategory: 'Vocabulary', topic: 'Business' },
      { id: "q7", question: "I am looking forward to ___ you.", options: ["meet", "met", "meeting", "have met"], correct: "meeting", difficultyElo: 1350, skillCategory: 'Grammar', topic: 'Business' },
      { id: "q8", question: "Despite the heavy rain, they ___ to reach the summit.", options: ["succeeded", "managed", "achieved", "fulfilled"], correct: "managed", difficultyElo: 1420, skillCategory: 'Vocabulary', topic: 'Travel' },
      { id: "q9", question: "He has a lot of experience ___ software engineering.", options: ["in", "on", "at", "for"], correct: "in", difficultyElo: 1200, skillCategory: 'Grammar', topic: 'Technology' },
      { id: "q10", question: "Can you tell me where ___?", options: ["is the station", "the station is", "the station does", "does the station"], correct: "the station is", difficultyElo: 1300, skillCategory: 'Grammar', topic: 'Travel' },
      
      { id: "q11", question: "Read the text: 'The hotel requires a deposit upon check-in.' What is required?", options: ["Full payment", "A passport", "A deposit", "Nothing"], correct: "A deposit", difficultyElo: 1150, skillCategory: 'Reading', topic: 'Travel' },
      { id: "q12", question: "Choose the correct synonym for 'meticulous'.", options: ["Careless", "Thorough", "Fast", "Messy"], correct: "Thorough", difficultyElo: 1600, skillCategory: 'Vocabulary', topic: 'Academic' },
      { id: "q13", question: "She is very good ___ learning languages.", options: ["at", "in", "about", "for"], correct: "at", difficultyElo: 1100, skillCategory: 'Grammar', topic: 'Education' },
      { id: "q14", question: "I have been living in New York ___ 5 years.", options: ["since", "for", "during", "in"], correct: "for", difficultyElo: 1200, skillCategory: 'Grammar', topic: 'Daily Life' },
      { id: "q15", question: "The CEO decided to ___ the meeting until next week.", options: ["put off", "put on", "put up", "put away"], correct: "put off", difficultyElo: 1550, skillCategory: 'Vocabulary', topic: 'Business' },
      
      { id: "q16", question: "I wish I ___ more time to finish this project.", options: ["have", "had", "will have", "have had"], correct: "had", difficultyElo: 1400, skillCategory: 'Grammar', topic: 'Business' },
      { id: "q17", question: "Please turn off the lights before ___ the room.", options: ["leave", "left", "leaving", "to leave"], correct: "leaving", difficultyElo: 1250, skillCategory: 'Grammar', topic: 'Daily Life' },
      { id: "q18", question: "Which word is an antonym of 'abundant'?", options: ["plentiful", "scarce", "heavy", "rich"], correct: "scarce", difficultyElo: 1500, skillCategory: 'Vocabulary', topic: 'Academic' },
      { id: "q19", question: "Hardly had I arrived home ___ my phone rang.", options: ["than", "when", "that", "while"], correct: "when", difficultyElo: 1650, skillCategory: 'Grammar', topic: 'Daily Life' },
      { id: "q20", question: "It's highly recommended that he ___ a doctor.", options: ["sees", "saw", "see", "seen"], correct: "see", difficultyElo: 1600, skillCategory: 'Grammar', topic: 'Health' }
    ];
    console.log(`Đã load thành công ${this.questionBank.length} câu hỏi mẫu chất lượng cao!`);
  }

  async getPlacementQuestions() {
    if (!this.questionBank || this.questionBank.length === 0) {
      this.loadQuestionBank();
    }
    
    // Lấy ngẫu nhiên 10 câu để làm test
    const shuffled = [...this.questionBank].sort(() => 0.5 - Math.random());
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

        const timeTakenMs = ans.timeTakenMs || (Math.random() * 10000 + 5000);

        const skill = q.skillCategory as keyof UserProficiency || 'Grammar';
        const userEloForSkill = userProficiency[skill];
        const questionElo = q.difficultyElo || 1200;

        const { newUserElo } = updateAdvancedElo(userEloForSkill, questionElo, isCorrect, timeTakenMs);
        
        userProficiency[skill] = newUserElo;
      }
    });

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
      score: `${totalScore}/${userAnswers.length}`,
      recommendedCourses: finalCourses
    };
  }
}

export const onboardingService = new OnboardingService();
