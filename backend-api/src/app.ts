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
import memoryCardRouter from "./module/memory-card/memory-card.route.js";
import { studentManageRouter } from "./module/StudentManage/studenManage.route.js";
import { wordRouter } from "./module/word/word.route.js";
import { courseRouter } from "./module/course/course.route.js";
import { testRouter } from "./module/test/test.route.js";
import { topicRouter } from "./module/topic/topic.route.js";
import achievementRouter from "./module/achievement/achievement.route.js";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";

export function createapp() {
    const app = express();

    app.disable("x-powered-by");
    app.use(pinoHttp({
        logger: loggers,
        serializers: {
            req(req) {
                if (req.headers?.authorization) {
                    req.headers.authorization = "Bearer ***HIDDEN***";
                }
                return req;
            }
        },
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
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static("uploads")); // Phục vụ file ảnh/âm thanh
    app.set("trust proxy", 1);
    // Giới hạn 1000 req trong 1 phút (tăng lên để tránh lỗi 429 khi code frontend)
    app.use(rateLimit({
        limit: 1000,
        windowMs: 60_000,
        standardHeaders: 'draft-8',
        legacyHeaders: false
    }));

    app.use("/api/auth", Authrouter)

    //đăng ký route quản lý học viên
    app.use("/api/admin/students", studentManageRouter);
    //đăng ký route quản lý từ vựng
    app.use("/api/admin/word", wordRouter);
    // Đăng ký route quản lý bài học
    app.use("/api/admin/courses", courseRouter);
    app.use("/api/admin/topics", topicRouter);
    app.use("/api/admin/achievements", achievementRouter);
    // Đăng ký route quản lý bài kiểm tra
    app.use("/api/admin/tests", testRouter);
    // Đăng ký route game
    app.use("/game/bubble-game", bubbleGameRouter);
    app.use("/game/memory-card", memoryCardRouter);

    // Đăng ký Swagger UI tài liệu API
    const swaggerPath = fs.existsSync(path.resolve(process.cwd(), "src/swagger-output.json"))
        ? path.resolve(process.cwd(), "src/swagger-output.json")
        : path.resolve(process.cwd(), "dist/swagger-output.json");

    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }

    app.use(errorHandler);
    return app
}