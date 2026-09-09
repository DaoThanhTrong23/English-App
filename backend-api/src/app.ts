import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loggers } from "./utils/logger.js";
import { errorHandler } from "./shared/http/error-handler.js";
import Authrouter from "./module/auth/auth.route.js";
import bubbleGameRouter from "./module/bubble-game/bubble-game.route.js";
export function createapp()  {
    const app = express();

    app.disable("x-powered-by");
    app.use(pinoHttp({
        logger: loggers,
        customLogLevel: (req, res, err) => {
            if (res.statusCode >= 500 || err) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
        },
        // Tùy biến thông điệp ngắn gọn khi request hoàn tất (VD: "POST /api/auth/login 200 - 15ms")
        customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
        customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
    }));
    app.use(helmet());
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: false }));

    // Giới hạn 100kb/request json
    app.use(express.json({ limit: '100 kb' }));

    // Giới hạn 100 req 1 phút
    app.use(rateLimit({
        limit: 100,
        windowMs: 60_000,
        standardHeaders: 'draft-8',
        legacyHeaders: false
    }));

    app.use("/api/auth", Authrouter)
    // Đăng ký route game
    app.use("/game", bubbleGameRouter);

    app.use(errorHandler);
    return app
}