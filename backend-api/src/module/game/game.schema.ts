import { z } from "zod";

export const DIFFICULTY_LEVELS = ["EASY", "NORMAL", "HARD"] as const;

export const GameSettingSchema = z.object({
  difficulty: z.enum(DIFFICULTY_LEVELS),
  itemCount: z.coerce.number().int().positive("Số lượng từ phải lớn hơn 0"),
  pointsPerItem: z.coerce.number().int().nonnegative("Điểm không được âm"),
  timeLimit: z.coerce.number().int().positive().nullable().optional(),
});

export const UpdateGameSettingsSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("ID game không hợp lệ"),
  }),
  body: z.object({
    settings: z.array(GameSettingSchema).min(1, "Cần cấu hình ít nhất 1 độ khó"),
  }),
  query: z.object({}),
});

export type UpdateGameSettingsInput = z.infer<typeof UpdateGameSettingsSchema>["body"];
