import pino from "pino";
import { env } from "../config/env.js";

export const loggers = pino({
    level: env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: "HH:MM:ss",        // Thời gian ngắn gọn (VD: 14:36:18)
            ignore: "pid,hostname,req,res,err",   // Ẩn toàn bộ thông tin headers, req, res rườm rà
            singleLine: true
        }
    }
});