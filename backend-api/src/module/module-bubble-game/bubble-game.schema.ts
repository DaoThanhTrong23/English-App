import { z } from "zod";

// schema cho GET /game/start
export const StartGameSchema = z.object(
    {
        body: z.object({}),
        query: z.object(
            {
                lessonId: z.coerce
                    .number({ invalid_type_error: "lessionId phải là số nguyên" })
                    .int()
                    .positive("lessionId phải lớn hơn 0")
                    .optional(),
                limit: z.coerce
                    .number({ invalid_type_error: "limit phải là số nguyên" })
                    .int()
                    .min(4, "Cần tối thiểu 4 cặp từ để chơi")
                    .max(20, "Tối đa 20 cặp từ mỗi ván")
                    .default(8)
            }
        ),
        params: z.object({})
    }
)

// Schema cho POST /game/match
export const MatchPairSchema = z.object(
    {
        body: z.object(
            {
                sessionId: z
                    .string({ required_error: "sessionId không được để trống" })
                    .uuid("sessionId phải là UUID hợp lệ"),
                wordId: z
                    .number({ required_error: "wordId không được để trống" })
                    .int()
                    .positive("wordId phải là số dương"),
                meaningId: z
                    .number({ required_error: "meaningId không được để trống" })
                    .int()
                    .positive("meaningId phải là số dương")
            }
        ),
        query: z.object({}),
        params: z.object({})
    }
);

// Schema cho POST /game/finish
export const FinishGameSchema = z.object(
    {
        body: z.object(
            {
                sessionId: z
                    .string({ required_error: "sessionId không được để trống" })
                    .uuid("sessionId phải là UUID hợp lệ")
            }
        ),
        query: z.object({}),
        params: z.object({})
    }
);

export type StartGameQuery = z.infer<typeof StartGameSchema>["query"];
export type MatchPairBody = z.infer<typeof MatchPairSchema>["body"];
export type FinishGameBody = z.infer<typeof FinishGameSchema>["body"];