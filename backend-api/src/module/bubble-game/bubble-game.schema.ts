import { z } from "zod";

// 1. Schema cho GET /game/start (Lấy danh sách từ vựng)
export const StartGameSchema = z.object({
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
      .min(4, "Cần tối thiểu 4 cặp từ để chơi")
      .max(20, "Tối đa 20 cặp từ mỗi ván")
      .default(8)
  }),
  params: z.object({})
});

// 2. Schema cho POST /game/match (Lưu tiến trình tạm thời từ FE)
export const MatchPairSchema = z.object({
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
      .min(1, "Tổng số cặp từ phải lớn hơn 0"),
    lessonId: z.number().int().positive().optional()
  }),
  query: z.object({}),
  params: z.object({})
});

// 3. Schema cho POST /game/finish (Chốt kết quả game từ FE)
export const FinishGameSchema = z.object({
  body: z.object({
    totalScore: z
      .number({ required_error: "totalScore không được để trống" })
      .int()
      .min(0, "Tổng điểm không được âm"),
    duration: z
      .number({ required_error: "duration không được để trống" })
      .int()
      .min(0, "Thời gian chơi (giây) không được âm"),
    correctPairs: z
      .number({ required_error: "correctPairs không được để trống" })
      .int()
      .min(0, "Số cặp đúng không được âm"),
    totalPairs: z
      .number({ required_error: "totalPairs không được để trống" })
      .int()
      .min(1, "Tổng số cặp từ phải lớn hơn 0"),
    lessonId: z.number().int().positive().optional()
  }),
  query: z.object({}),
  params: z.object({})
});

export type StartGameQuery = z.infer<typeof StartGameSchema>["query"];
export type MatchPairBody = z.infer<typeof MatchPairSchema>["body"];
export type FinishGameBody = z.infer<typeof FinishGameSchema>["body"];