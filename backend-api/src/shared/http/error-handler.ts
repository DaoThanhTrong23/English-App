import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "./api-error.js";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";
import multer from "multer";


export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
    if (error instanceof ZodError) {
        response.status(422).json({
            error: {
                code: "validation_error",
                message: "Request validation failed.",
                details: error.flatten()
            },
            path: request.path
        });
        return;
    }

    if (error instanceof ApiError) {
        response.status(error.statuscode).json({
            error: { code: error.code, message: error.message },
            path: request.path,
        });
        return;
    }

    if (error instanceof PrismaClientInitializationError) {
        response.status(500).json({
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