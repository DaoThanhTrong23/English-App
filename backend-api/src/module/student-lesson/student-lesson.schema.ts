import { z } from "zod";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/**
 * Schema lấy danh sách khóa học cho học viên
 */
export const GetStudentCoursesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1, "Page phải lớn hơn 0").default(1),
    limit: z.coerce.number().int().min(1).max(50, "Limit tối đa 50").default(10),
    search: z.string().trim().optional(),
    targetLevelGroup: z.string().optional(),
    cefrLevel: z.enum(CEFR_LEVELS, {
      errorMap: () => ({ message: "cefrLevel phải thuộc A1, A2, B1, B2, C1 hoặc C2" }),
    }).optional(),
  }),
  body: z.object({}),
  params: z.object({}),
});

/**
 * Schema kiểm tra Course ID trong params
 */
export const StudentCourseIdParamSchema = z.object({
  params: z.object({
    courseId: z.coerce.number().int().positive("ID khóa học không hợp lệ"),
  }),
  body: z.object({}),
  query: z.object({}),
});

/**
 * Schema kiểm tra Lesson ID trong params
 */
export const StudentLessonIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID bài học không hợp lệ"),
  }),
  body: z.object({}),
  query: z.object({}),
});

export type GetStudentCoursesQueryInput = z.infer<typeof GetStudentCoursesQuerySchema>["query"];
export type StudentCourseIdParamInput = z.infer<typeof StudentCourseIdParamSchema>["params"];
export type StudentLessonIdParamInput = z.infer<typeof StudentLessonIdParamSchema>["params"];
