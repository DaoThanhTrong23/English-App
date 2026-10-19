import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "./api-error.js";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import multer from "multer";


export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
    if (error instanceof ZodError) {
        const firstMessage = error.issues?.[0]?.message || "Request validation failed.";
        response.status(422).json({
            message: firstMessage,
            error: {
                code: "validation_error",
                message: firstMessage,
                details: error.flatten()
            },
            path: request.path
        });
        return;
    }

    if (error instanceof ApiError) {
        response.status(error.statuscode).json({
            message: error.message,
            error: { code: error.code, message: error.message },
            path: request.path,
        });
        return;
    }

    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
            ? (error.meta.target as string[]).join(" ")
            : String(error.meta?.target || "");
        let message = "Dữ liệu đã tồn tại trong hệ thống";
        let code = "duplicate_field";
        if (target.includes("email") && target.includes("username")) {
            message = "Cả email và tên đăng nhập này đều đã được đăng ký tài khoản khác";
            code = "credential_already_exists";
        } else if (target.includes("email")) {
            message = "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập";
            code = "email_already_exists";
        } else if (target.includes("username")) {
            message = "Tên đăng nhập này đã tồn tại. Vui lòng chọn tên đăng nhập khác";
            code = "username_already_exists";
        }
        response.status(409).json({
            message,
            error: { code, message },
            path: request.path,
        });
        return;
    }

    if (error instanceof PrismaClientInitializationError) {
        response.status(500).json({
            message: "Không trích thông tin từ cơ sở dữ liệu",
            error: {
                code: error.errorCode,
                message: "Không trích thông tin từ cơ sở dữ liệu"
            },
            path: request.path
        })
        return;
    }

    if (error instanceof multer.MulterError) {
        let message = error.message;
        if (error.code === "LIMIT_FILE_SIZE") message = "File âm thanh tải lên vượt quá dung lượng cho phép tối đa"
        if (error.code === "MISSING_FIELD_NAME") message = "Vui lòng chọn và đặt tên trường cho file tải lên";

        response.status(400).json({
            error: { code: error.code, message },
            path: request.path
        });
        return;
    }

    // Lỗi hệ thống
    console.error("DEBUG ERROR HANDLER:", error);
    request.log.error(error);
    response.status(500).json({
        error: { code: "internal_error", message: "Lỗi không xác định từ Server" },
        path: request.path,
    });
}