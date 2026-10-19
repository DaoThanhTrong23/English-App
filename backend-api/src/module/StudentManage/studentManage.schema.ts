import z from "zod";

//Schema lấy học viên và có các truy vấn trong đó tuỳ FE muốn lấy như thế nào
export const GetStudentQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        search: z.string().trim().optional(),
        sortBy: z.enum(["createdAt", "lastLoginDate", "xpPoints", "username"]).default("createdAt"),
        sortOrder: z.enum(["asc","desc"]).default("desc")
    }),
    body: z.object({}),
    params: z.object({})
});

export const StudentIdParamSchema = z.object({
    query: z.object({}),
    body: z.object({}),
    params: z.object({
        id: z.coerce.number().int().positive("ID của học viên không hợp lệ")
    })
});

export const UpdateStudentStatusSchema = z.object({
    query: z.object({}),
    params: z.object({
        id: z.coerce.number().int().positive("ID của học viên không hợp lệ")
    }),
    body: z.object({
        isLocked: z.preprocess((val) => {
            if (typeof val === "boolean") return val;
            if (val === "true" || val === 1 || val === "1") return true;
            if (val === "false" || val === 0 || val === "0") return false;
            return val;
        }, z.boolean({ invalid_type_error: "isLocked phải là boolean (true/false)", required_error: "isLocked không được để trống" }))
    })
});

export type GetStudentQueryInput = z.infer<typeof GetStudentQuerySchema>["query"];
export type StudentIdParamInput = z.infer<typeof StudentIdParamSchema>["params"];
export type UpdateStudentStatusInput = z.infer<typeof UpdateStudentStatusSchema>;