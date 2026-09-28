import { z } from "zod";

export const GradeEssaySchema = z.object({
  body: z.object({
    text: z.string().min(5, "Đoạn văn phải có ít nhất 5 ký tự").max(5000, "Đoạn văn tối đa 5000 ký tự"),
    topic: z.string().optional(), // Có thể truyền thêm chủ đề hoặc không
  }),
});

export type GradeEssayInput = z.infer<typeof GradeEssaySchema>["body"];

export interface EssayEvaluationResponse {
  overallScore: number;       // Thang 10 (VD: 6.5)
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  grammarScore: number;      // Thang 10
  vocabularyScore: number;   // Thang 10
  feedback: string;          // Nhận xét tổng quan (Tiếng Việt)
  strengths: string[];       // Điểm tốt
  improvements: string[];    // Những điểm cần cải thiện
  corrections: Array<{
    original: string;        // Đoạn văn / câu gốc bị sai
    issue: string;           // Lỗi sai là gì
    suggestion: string;      // Gợi ý sửa lại cho đúng
  }>;
  improvedVersion: string;   // Bản viết lại mẫu tự nhiên hơn
}

// Kết quả trả về cho bài Nói (Speaking)
export interface SpeakingEvaluationResponse {
  transcript: string;          // Văn bản nhận diện được từ giọng nói (Speech-to-Text)
  overallScore: number;        // Điểm tổng thang 10.0 (VD: 6.5)
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  grammarScore: number;       // Điểm ngữ pháp (thang 10)
  vocabularyScore: number;    // Điểm từ vựng (thang 10)
  coherenceScore: number;     // Điểm độ mạch lạc, lưu loát (thang 10)
  feedback: string;           // Nhận xét tổng quan (Tiếng Việt)
  strengths: string[];        // Điểm làm tốt
  improvements: string[];     // Điểm cần cải thiện
  corrections: Array<{
    original: string;         // Câu người học nói bị sai
    issue: string;            // Giải thích lỗi sai
    suggestion: string;       // Cách nói lại cho đúng
  }>;
  improvedVersion: string;    // Bản nói lại hoàn chỉnh mượt mà hơn
}

// Chi tiết điểm số từng âm vị theo thuật toán GOP (Goodness of Pronunciation)
export interface PhonemeScoreDetail {
  phoneme: string;            // Âm vị mục tiêu (VD: "/h/", "/oʊ/")
  score: number;              // Điểm % độ chuẩn xác (0 - 100)
  status: "correct" | "poor" | "silent_insertion";
  heardAs: string;            // Âm mà hệ thống nghe thấy người học phát âm
  feedback: string;           // Nhận xét ngắn về âm này
}

// Kết quả trả về cho tính năng Chấm điểm phát âm chi tiết (GOP & Phonetic Assessment)
export interface PronunciationEvaluationResponse {
  targetWord: string;         // Từ mục tiêu (VD: "Hello")
  targetIpa: string;          // Phiên âm chuẩn IPA (VD: "/həˈloʊ/")
  spokenText: string;         // Âm/từ nhận diện được từ giọng nói học viên (VD: "He - lơ", hoặc "abcd")
  overallScore: number;       // Điểm số % tổng quát (0 - 100%)
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  
  details: {
    vowelAccuracy: number;     // Độ chuẩn nguyên âm (0 - 100)
    consonantAccuracy: number; // Độ chuẩn phụ âm & âm đuôi (0 - 100)
    stressAccuracy: number;    // Độ chuẩn trọng âm (0 - 100)
    fluencyScore: number;      // Độ liền mạch, không ngắt quãng (0 - 100)
  };

  phonemeScores: PhonemeScoreDetail[]; // Đánh giá chi tiết từng âm vị (GOP Breakdown)
  silentLetterErrors: string[];        // Danh sách các lỗi đọc chữ câm (nếu có)
  
  explanation: string;         // Giải thích vì sao học viên phát âm ra như vậy
  improvement: {
    mouthShape: string;        // Hướng dẫn khẩu hình môi & vị trí lưỡi
    practiceTip: string;       // Mẹo luyện tập từng bước
  };
}