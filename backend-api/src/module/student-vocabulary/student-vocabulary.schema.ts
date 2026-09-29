import { z } from "zod";

/**
 * Schema lấy danh sách từ vựng của học viên với phân trang Lazy Loading.
 * Tuyệt đối không chứa bất kỳ query nào khác (search, filter, status...) theo đúng yêu cầu.
 */
export const GetStudentVocabularyQuerySchema = z.object({
  query: z.object({
    cursor: z.coerce.number().int().positive("Cursor phải là số nguyên dương").optional(),
    limit: z.coerce.number().int().min(1, "Limit tối thiểu là 1").max(50, "Limit tối đa là 50").default(10),
    page: z.coerce.number().int().min(1, "Page phải từ 1 trở lên").optional(),
  }),
  body: z.object({}),
  params: z.object({}),
});

/**
 * Schema kiểm tra ID của bản ghi từ vựng học viên trong params
 */
export const StudentVocabularyIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID bản ghi không hợp lệ"),
  }),
  body: z.object({}),
  query: z.object({}),
});

/**
 * Schema thêm từ vựng vào danh sách của học viên
 * Hỗ trợ chọn từ có sẵn qua wordId hoặc tự tạo từ mới nếu chưa có trong hệ thống
 */
export const AddStudentVocabularySchema = z.object({
  body: z.object({
    wordId: z.coerce.number().int().positive("wordId phải là số nguyên dương").optional(),
    headword: z.string().trim().min(1, "Từ vựng không được để trống").max(100, "Từ vựng tối đa 100 ký tự").optional(),
    partOfSpeech: z.string().trim().max(50, "Từ loại tối đa 50 ký tự").nullish(),
    cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullish(),
    phonetic: z.string().trim().max(100, "Phiên âm tối đa 100 ký tự").nullish(),
    audioUrl: z.string().trim().url("URL âm thanh không hợp lệ").or(z.literal("")).nullish(),
    imageUrl: z.string().trim().url("URL hình ảnh không hợp lệ").or(z.literal("")).nullish(),
    meaning: z.string().trim().min(1, "Nghĩa của từ không được để trống").nullish(),
    exampleSentence: z.string().trim().nullish(),
    status: z.enum(["new", "learning", "mastered"]).optional().default("new"),
  }),
  params: z.object({}),
  query: z.object({}),
});

/**
 * Schema cập nhật từ vựng trong danh sách của học viên
 */
export const UpdateStudentVocabularySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID bản ghi không hợp lệ"),
  }),
  body: z.object({
    status: z.enum(["new", "learning", "mastered"]).optional(),
    memoryLevel: z.coerce.number().int().min(0, "Cấp độ ghi nhớ tối thiểu là 0").max(10, "Cấp độ ghi nhớ tối đa là 10").optional(),
    nextReviewDate: z.string().datetime({ message: "nextReviewDate phải đúng định dạng ngày giờ ISO 8601" }).optional(),
    meaning: z.string().trim().min(1, "Nghĩa của từ không được để trống").optional(),
    exampleSentence: z.string().trim().optional(),
  }),
  query: z.object({}),
});

export type GetStudentVocabularyQueryInput = z.infer<typeof GetStudentVocabularyQuerySchema>["query"];
export type StudentVocabularyIdParamInput = z.infer<typeof StudentVocabularyIdParamSchema>["params"];
export type AddStudentVocabularyInput = z.infer<typeof AddStudentVocabularySchema>["body"];
export type UpdateStudentVocabularyInput = z.infer<typeof UpdateStudentVocabularySchema>["body"];
