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