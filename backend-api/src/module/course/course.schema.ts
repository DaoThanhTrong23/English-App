import { z } from "zod";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/**
 * Schema lấy danh sách khóa học với phân trang, tìm kiếm và bộ lọc
 */
export const GetCoursesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1, "Page phải lớn hơn 0").default(1),
    limit: z.coerce.number().int().min(1).max(100, "Limit tối đa 100").default(10),
    search: z.string().trim().optional(),
    cefrLevel: z.enum(CEFR_LEVELS, {
      errorMap: () => ({ message: "cefrLevel phải thuộc A1, A2, B1, B2, C1 hoặc C2" }),
    }).optional(),
    isDeleted: z.preprocess(
      (val) => (val === "true" || val === true ? true : val === "false" || val === false ? false : undefined),
      z.boolean().optional().default(false)
    ),
    sortBy: z.enum(["createdAt", "title", "cefrLevel"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
  body: z.object({}),
  params: z.object({}),
});

/**
 * Schema kiểm tra Course ID trong params
 */
export const CourseIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID khóa học không hợp lệ"),
  }),
  body: z.object({}),
  query: z.object({}),
});

/**
 * Schema tạo mới một khóa học
 */
export const CreateCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Tiêu đề không được để trống").max(100, "Tiêu đề tối đa 100 ký tự"),
    description: z.string().trim().nullish(),
    cefrLevel: z.enum(CEFR_LEVELS).nullish(),
    thumbnailUrl: z.string().trim().url("URL ảnh không hợp lệ").or(z.literal("")).nullish(),
    wordIds: z.array(z.coerce.number().int().positive("Word ID không hợp lệ")).optional().default([]),
  }),
  query: z.object({}),
  params: z.object({}),
});

/**
 * Schema cập nhật một khóa học
 */
export const UpdateCourseSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID khóa học không hợp lệ"),
  }),
  body: z.object({
    title: z.string().trim().min(1, "Tiêu đề không được để trống").max(100, "Tiêu đề tối đa 100 ký tự").optional(),
    description: z.string().trim().nullish(),
    cefrLevel: z.enum(CEFR_LEVELS).nullish(),
    thumbnailUrl: z.string().trim().url("URL ảnh không hợp lệ").or(z.literal("")).nullish(),
    wordIds: z.array(z.coerce.number().int().positive("Word ID không hợp lệ")).optional(),
  }),
  query: z.object({}),
});

/**
 * Schema gán danh sách từ vựng vào khóa học
 */
export const AddWordsToCourseSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID khóa học không hợp lệ"),
  }),
  body: z.object({
    wordIds: z.array(z.coerce.number().int().positive("Word ID không hợp lệ")).min(1, "Cần ít nhất một từ vựng để thêm vào khóa học"),
  }),
  query: z.object({}),
});

/**
 * Schema gỡ từ vựng ra khỏi khóa học
 */
export const CourseWordParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID khóa học không hợp lệ"),
    wordId: z.coerce.number().int().positive("Word ID không hợp lệ"),
  }),
  body: z.object({}),
  query: z.object({}),
});

export type GetCoursesQueryInput = z.infer<typeof GetCoursesQuerySchema>["query"];
export type CourseIdParamInput = z.infer<typeof CourseIdParamSchema>["params"];
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>["body"];
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>["body"];
export type AddWordsToCourseInput = z.infer<typeof AddWordsToCourseSchema>["body"];
export type CourseWordParamInput = z.infer<typeof CourseWordParamSchema>["params"];
