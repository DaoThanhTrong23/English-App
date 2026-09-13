import { z } from "zod";

// 1. Schema cho GET /game/memory-card/start (Lấy 12 thẻ từ 6 từ vựng)
export const StartMemoryGameSchema = z.object({
  body: z.object({}),
  query: z.object({
    lessonId: z.coerce
      .number({ invalid_type_error: "lessonId phải là số nguyên" })
      .int()
      .positive("lessonId phải lớn hơn 0")
      .optional(),
    limit: z.coerce
      .number({ invalid_type_error: "limit phải là số nguyên" })
      .int()
      .min(2, "Cần tối thiểu 2 cặp từ để chơi")
      .max(12, "Tối đa 12 cặp từ mỗi ván")
      .default(6), // Mặc định 6 từ = 12 thẻ hiển thị
  }),
  params: z.object({}),
});

// 2. Schema cho POST /game/memory-card/progress (Lưu tiến trình tạm thời từ FE)
export const SaveProgressSchema = z.object({
  body: z.object({
    currentScore: z
      .number({ required_error: "currentScore không được để trống" })
      .int()
      .min(0, "Điểm số không được âm"),
    matchedPairs: z
      .number({ required_error: "matchedPairs không được để trống" })
      .int()
      .min(0, "Số cặp đã ghép không được âm"),
    totalPairs: z
      .number({ required_error: "totalPairs không được để trống" })
      .int()
      .min(1, "Tổng số cặp từ phải lớn hơn 0")
      .default(6),
    turns: z
      .number({ required_error: "turns không được để trống" })
      .int()
      .min(0, "Số lượt lật không được âm")
      .default(0),
    lessonId: z.number().int().positive().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

// 3. Schema cho POST /game/memory-card/finish (Chốt kết quả ván chơi từ FE)
export const FinishMemoryGameSchema = z.object({
  body: z.object({
    totalScore: z
      .number({ required_error: "totalScore không được để trống" })
      .int()
      .min(0, "Tổng điểm không được âm"),
    duration: z
      .number({ required_error: "duration không được để trống" })
      .int()
      .min(0, "Thời gian chơi (giây) không được âm"),
    turns: z
      .number({ required_error: "turns không được để trống" })
      .int()
      .min(0, "Số lượt lật không được âm"),
    correctPairs: z
      .number({ required_error: "correctPairs không được để trống" })
      .int()
      .min(0, "Số cặp đúng không được âm"),
    totalPairs: z
      .number({ required_error: "totalPairs không được để trống" })
      .int()
      .min(1, "Tổng số cặp từ phải lớn hơn 0")
      .default(6),
    lessonId: z.number().int().positive().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export type StartMemoryGameQuery = z.infer<typeof StartMemoryGameSchema>["query"];
export type SaveProgressBody = z.infer<typeof SaveProgressSchema>["body"];
export type FinishMemoryGameBody = z.infer<typeof FinishMemoryGameSchema>["body"];
