import z from "zod";

export const RegisterSchema = z.object({
    body: z.object({
        username: z.string()
                    .min(3,"Tài khoản tối thiểu 3 ký tự")
                    .max(50,"Tài khoản dài tối đa 50 ký tự")
                    .regex(/^[a-zA-Z0-9_]+$/,"Username chỉ chứa chữ, số và dấu gạch dưới"),
        email: z.string().email("Email không đúng định dạng").max(100),
        password: z.string().min(6,"mật khẩu phải chứa ít nhất 6 ký tự").max(100)
    }),
    query: z.object({}),
    params: z.object({})
});

export const LoginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, "Vui lòng nhập Email hoặc Username"),
        password: z.string().min(1, "Vui lòng nhập mật khẩu"),
        deviceInfo: z.string().optional()
    }),
    query: z.object({}),
    params: z.object({})
})

export const LogoutSchema = z.object({
    body: z.object({
        refreshToken : z.string().min(1,"Refresh token không được để trống")
    }),
    query: z.object({}),
    params: z.object({})
})


export const RefreshTokenSChema = z.object({
    body: z.object({
        refreshToken : z.string().min(1,"Refresh token không được để trống")
    }),
    query: z.object({}),
    params: z.object({})
})


export const GoogleLoginSchema = z.object({
    body: z.object({
        idToken: z.string().min(1, "Thiếu idToken của Google"),
        deviceInfo: z.string().optional()
    }),
    query: z.object({}),
    params: z.object({})
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type LogoutInput = z.infer<typeof LogoutSchema>["body"];
export type RefreshTokenInput = z.infer<typeof RefreshTokenSChema>["body"]