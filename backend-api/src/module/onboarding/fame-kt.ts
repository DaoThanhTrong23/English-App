export const CEFR_THRESHOLDS = {
  A1: 1000,
  A2: 1200,
  B1: 1400,
  B2: 1600,
  C1: 1800,
};

// =========================================================================
// THUẬT TOÁN HOÀN THIỆN (FAME-KT - Fuzzy Adaptive Multi-dimensional Elo)
// Ưu việt hơn Elo, BKT và IRT truyền thống ở các điểm thực tế.
// =========================================================================

/**
 * CẢI TIẾN 1: Hợp nhất IRT và Elo (Xử lý vấn đề Đoán mò - Guessing Factor)
 * Elo truyền thống mặc định user không biết gì thì xác suất đúng là 0%.
 * Thực tế trắc nghiệm 4 đáp án (A,B,C,D) thì xác suất đoán lụi luôn là 25% (0.25).
 * Công thức này đưa tham số c (Guessing = 0.25) của IRT vào Elo.
 */
export function getExpectedScoreIRT(userElo: number, questionElo: number, c_guessing: number = 0.25): number {
  const probKnowledge = 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
  return c_guessing + (1 - c_guessing) * probKnowledge;
}

/**
 * CẢI TIẾN 2: Penalty Anti-Bot & Phân tích tâm lý học thời gian (Psychometrics)
 * - Trả lời siêu nhanh (< 2s): Chắc chắn là bấm bừa/bot -> Không tính điểm hoặc trừ điểm nhẹ.
 * - Trả lời trong Vùng tối ưu (Optimal: 5s - 15s): Thưởng hệ số cao (Nắm vững kiến thức).
 * - Trả lời chậm (> 30s): Bị phân tâm hoặc tra từ điển -> Hệ số cực thấp.
 */
function calculateTimeFactor(timeTakenMs: number, expectedTimeMs: number = 20000): number {
  const timeTakenSec = timeTakenMs / 1000;
  
  if (timeTakenSec < 2) return 0.2; // Bấm lụi mù quáng (Anti-bot)
  if (timeTakenSec >= 2 && timeTakenSec <= 15) return 1.5; // Optimal Flow (Phản xạ tốt)
  if (timeTakenSec > 15 && timeTakenSec <= expectedTimeMs/1000) return 1.0; // Bình thường
  
  // Trả lời quá chậm (Tra google hoặc phân vân quá lâu)
  return Math.max(0.3, expectedTimeMs / timeTakenMs); 
}

/**
 * Hàm Cập nhật Elo Hoàn chỉnh
 */
export function updateAdvancedElo(
  userElo: number, 
  questionElo: number, 
  isCorrect: boolean, 
  timeTakenMs: number
) {
  const actualScore = isCorrect ? 1 : 0;
  const expectedScore = getExpectedScoreIRT(userElo, questionElo);
  const timeFactor = calculateTimeFactor(timeTakenMs);
  
  const K_BASE = 32;
  const kDynamic = K_BASE * timeFactor;
  
  // Cập nhật cả 2: Năng lực User và Độ khó Câu hỏi
  return {
    newUserElo: Math.round(userElo + kDynamic * (actualScore - expectedScore)),
    newQuestionElo: Math.round(questionElo + kDynamic * (expectedScore - actualScore)) 
  };
}

/**
 * CẢI TIẾN 3: Đánh giá Đa chiều (Multi-Dimensional Knowledge Tracing)
 * Tiếng Anh không thể gộp chung 1 điểm. Phải chia thành: Ngữ pháp, Từ vựng, Nghe, Đọc.
 */
export type UserProficiency = {
  Grammar: number;
  Vocabulary: number;
  Listening: number;
  Reading: number;
};

// Khởi tạo năng lực mặc định
export function createNewUserProficiency(): UserProficiency {
  return { Grammar: 1200, Vocabulary: 1200, Listening: 1200, Reading: 1200 };
}

// Map sang CEFR
export function getCEFRLevel(elo: number): string {
  if (elo < CEFR_THRESHOLDS.A2) return 'A1';
  if (elo < CEFR_THRESHOLDS.B1) return 'A2';
  if (elo < CEFR_THRESHOLDS.B2) return 'B1';
  if (elo < CEFR_THRESHOLDS.C1) return 'B2';
  return 'C1';
}

/**
 * CẢI TIẾN 5: Hệ thống Gợi ý lai (Tìm điểm yếu) (Hybrid Recommender System)
 * Tự động phân tích Điểm yếu nhất (Weakest Link) trong Vector năng lực để gợi ý học bù.
 */
export type Lesson = { id: string; title: string; cefr: string; topic: string; skillCategory: keyof UserProficiency };

export function recommendPersonalizedPath(
  userProficiency: UserProficiency, 
  userTopics: string[], 
  allLessons: Lesson[]
) {
  // Tìm kỹ năng đang bị "Thọt" nhất (Điểm thấp nhất)
  let weakestSkill: keyof UserProficiency = 'Grammar';
  let minElo = 9999;
  for (const [skill, elo] of Object.entries(userProficiency)) {
    if (elo < minElo) { minElo = elo; weakestSkill = skill as keyof UserProficiency; }
  }

  const weakestCefr = getCEFRLevel(minElo);

  // Chấm điểm từng bài học trong DB
  const scoredLessons = allLessons.map(lesson => {
    let score = 0;
    
    // 1. Ưu tiên vá lỗ hổng (Weakest Skill)
    if (lesson.skillCategory === weakestSkill) score += 20;
    
    // 2. Phù hợp Trình độ CEFR
    if (lesson.cefr === weakestCefr) score += 10;
    
    // 3. Phù hợp Sở thích (Topic)
    if (userTopics.includes(lesson.topic)) score += 5;
    
    return { ...lesson, score };
  });

  return scoredLessons.filter(l => l.score > 10).sort((a, b) => b.score - a.score);
}

/**
 * CẢI TIẾN 4: TỰ ĐỘNG DỪNG (Early Stopping / CAT Auto-stop)
 * Dừng bài test sớm nếu điểm năng lực (Elo) của user đã ổn định (Hội tụ)
 * Giúp tiết kiệm thời gian, không cần làm hết toàn bộ số câu.
 */
export function checkEarlyStop(eloHistory: number[], minQuestions: number = 5): boolean {
  if (eloHistory.length < minQuestions) return false;
  
  // Lấy 3 lần thay đổi Elo gần nhất
  const recentElos = eloHistory.slice(-3);
  const variance = Math.max(...recentElos) - Math.min(...recentElos);
  
  // Nếu biên độ dao động Elo trong 3 câu gần nhất < 15 điểm -> Đã hội tụ
  if (variance < 15) return true;
  
  return false;
}
