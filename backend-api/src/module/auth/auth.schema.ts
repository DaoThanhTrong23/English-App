import z from "zod";

export const RegisterSchema = z.object({
    body: z.object({
        username: z.string()
                    .trim()
                    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
                    .max(50, "Tên đăng nhập dài tối đa 50 ký tự")
                    .regex(/^[a-zA-Z0-9_]+$/, "Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (_)"),
        email: z.string()
                    .trim()
                    .toLowerCase()
                    .email("Email không đúng định dạng")
                    .max(100, "Email dài tối đa 100 ký tự"),
        password: z.string()
            .min(8, "Mật khẩu phải dài ít nhất 8 ký tự")
            .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
            .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
            .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
            .regex(/[\W_]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")
            .max(100),
        deviceInfo: z.string().optional()
    }),
    query: z.object({}),
    params: z.object({})
});

export const CheckAvailabilitySchema = z.object({
    body: z.object({}),
    query: z.object({
        username: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().optional()
    }),
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

export const FacebookLoginSchema = z.object({
    body: z.object({
        accessToken: z.string().min(1, "Thiếu accessToken của Facebook"),
        deviceInfo: z.string().optional()
    }),
    query: z.object({}),
    params: z.object({})
});

export const ChangePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ"),
        newPassword: z.string()
            .min(8, "Mật khẩu phải dài ít nhất 8 ký tự")
            .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
            .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
            .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
            .regex(/[\W_]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt")
            .max(100)
    }),
    query: z.object({}),
    params: z.object({})
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type LogoutInput = z.infer<typeof LogoutSchema>["body"];
export type RefreshTokenInput = z.infer<typeof RefreshTokenSChema>["body"];
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>["body"];