import { z } from "zod";

// 1. Schema cho GET /game/word-matching/start (Lấy 10 từ vựng cho 2 cột A và B)
export const StartWordMatchingSchema = z.object({
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
      .min(4, "Cần tối thiểu 4 từ để chơi")
      .max(20, "Tối đa 20 từ mỗi ván")
      .default(10), // Mặc định 10 từ vựng theo luật chơi
  }),
  params: z.object({}),
});

// 2. Schema cho POST /game/word-matching/submit (Xác nhận nộp bài nối từ)
export const SubmitWordMatchingSchema = z.object({
  body: z.object({
    lessonId: z.number().int().positive().optional(),
    duration: z
      .number({ required_error: "duration (thời gian làm bài tính theo giây) không được để trống" })
      .int()
      .min(0, "Thời gian không được âm"),
    answers: z
      .array(
        z.object({
          wordId: z.number({ required_error: "wordId ở cột A không được để trống" }).int(),
          selectedMeaningId: z.number({ required_error: "selectedMeaningId ở cột B không được để trống" }).int(),
        })
      )
      .min(1, "Danh sách câu trả lời không được để trống"),
  }),
  query: z.object({}),
  params: z.object({}),
});

// 3. Schema cho POST /game/word-matching/progress (Lưu tiến trình nối tạm thời nếu cần)
export const SaveWordMatchingProgressSchema = z.object({
  body: z.object({
    lessonId: z.number().int().positive().optional(),
    currentMatchedPairs: z.number().int().min(0).default(0),
    totalPairs: z.number().int().min(1).default(10),
    connectedPairs: z.array(
      z.object({
        wordId: z.number().int(),
        selectedMeaningId: z.number().int(),
      })
    ).default([]),
  }),
  query: z.object({}),
  params: z.object({}),
});

export type StartWordMatchingQuery = z.infer<typeof StartWordMatchingSchema>["query"];
export type SubmitWordMatchingBody = z.infer<typeof SubmitWordMatchingSchema>["body"];
export type SaveWordMatchingProgressBody = z.infer<typeof SaveWordMatchingProgressSchema>["body"];
