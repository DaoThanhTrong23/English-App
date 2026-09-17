import { z } from "zod";

export const CreateTestSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Tiêu đề không được để trống").max(255),
    description: z.string().optional().nullable(),
    ceftLevel: z.string().max(10).optional().nullable(), // typo in DB: ceftLevel
  }),
});

export const UpdateTestSchema = z.object({
  params: z.object({
    testId: z.string().regex(/^\d+$/, "ID bài thi phải là số"),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    ceftLevel: z.string().max(10).optional().nullable(),
  }),
});

export const CreateQuestionSchema = z.object({
  params: z.object({
    testId: z.string().regex(/^\d+$/, "ID bài thi phải là số"),
  }),
  body: z.object({
    quesionText: z.string().min(1, "Câu hỏi không được để trống"), // typo in DB: quesionText
    questionType: z.enum(["multiple_choice", "fill_in_blank", "listening", "speaking", "writing"]).default("multiple_choice"),
    points: z.number().positive().default(10),
    audioUrl: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    answers: z.array(z.object({
      answerText: z.string().min(1, "Đáp án không được để trống"),
      isCorrect: z.boolean().default(false),
    })).min(1, "Cần ít nhất 1 đáp án"),
  }),
});

export const UpdateQuestionSchema = z.object({
  params: z.object({
    testId: z.string().regex(/^\d+$/, "ID bài thi phải là số"),
    questionId: z.string().regex(/^\d+$/, "ID câu hỏi phải là số"),
  }),
  body: z.object({
    quesionText: z.string().min(1).optional(),
    questionType: z.enum(["multiple_choice", "fill_in_blank", "listening", "speaking", "writing"]).optional(),
    points: z.number().positive().optional(),
    audioUrl: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    answers: z.array(z.object({
      id: z.number().optional(), // Nếu có id thì update, không có thì tạo mới
      answerText: z.string().min(1),
      isCorrect: z.boolean(),
    })).optional(),
  }),
});
