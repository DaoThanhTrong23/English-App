import { startCronJobs } from './cron/reminder.cron.js';
import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loggers } from "./utils/logger.js";
import { errorHandler } from "./shared/http/error-handler.js";
import Authrouter from "./module/auth/auth.route.js";
import { profileRouter } from "./module/auth/profile.route.js";
import bubbleGameRouter from "./module/bubble-game/bubble-game.route.js";
import memoryCardRouter from "./module/memory-card/memory-card.route.js";
import wordMatchingRouter from "./module/word-matching/word-matching.route.js";
import marioGameRouter from "./module/mario-game/mario-game.route.js";
import { studentManageRouter } from "./module/StudentManage/studenManage.route.js";
import { wordRouter } from "./module/word/word.route.js";
import { courseRouter } from "./module/course/course.route.js";
import { testRouter } from "./module/test/test.route.js";
import { topicRouter } from "./module/topic/topic.route.js";
import achievementRouter from "./module/achievement/achievement.route.js";
import { activityLogRouter } from "./module/activity-log/activity-log.route.js";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { aiRouter } from "./module/AI/ai.router.js";
import { onboardingRouter } from "./module/onboarding/onboarding.route.js";
import { gameRouter } from "./module/game/game.route.js";
import dashboardRouter from "./module/dashboard/dashboard.route.js";
import { leaderboardRouter } from "./module/leaderboard/leaderboard.route.js";
import { communityRouter } from "./module/community/community.route.js";
import { studentVocabularyRouter } from "./module/student-vocabulary/student-vocabulary.route.js";
import { studentCourseRouter, studentLessonRouter } from "./module/student-lesson/student-lesson.route.js";
import { studentTestRouter } from "./module/student-test/student-test.route.js";
import { notificationRouter } from "./module/notification/notification.route.js";
import { questRouter } from "./module/quest/quest.route.js";
import { keywordRouter } from "./module/keyword-setting/keyword-setting.route.js";
import { topicSettingRouter } from "./module/topic-setting/topic-setting.route.js";

export function createapp() {
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

    // Đăng ký route cho module auth
    app.use("/api/auth", Authrouter);
    app.use("/api/profile", profileRouter);
app.use("/api/onboarding", onboardingRouter);
    app.use("/api/admin/students", studentManageRouter);
    app.use("/api/admin/dashboard", dashboardRouter);
    app.use("/api/admin/logs", activityLogRouter);
    app.use("/api/admin/notifications", notificationRouter);
    app.use("/api/notifications", notificationRouter);
    // Đăng ký route quản lý từ vựng
    app.use("/api/admin/word", wordRouter);
    // Đăng ký route quản lý bài học
    app.use("/api/admin/courses", courseRouter);
    app.use("/api/admin/topics", topicRouter);
    app.use("/api/admin/keywords", keywordRouter);
    app.use("/api/admin/topic-settings", topicSettingRouter);
    app.use("/api/admin/achievements", achievementRouter);
    // Đăng ký route quản lý bài kiểm tra
    app.use("/api/admin/tests", testRouter);
    // Đăng ký route game
    app.use("/api/game/bubble-game", bubbleGameRouter);
    app.use("/api/game/memory-card", memoryCardRouter);
    app.use("/api/game/word-matching", wordMatchingRouter);
  app.use("/api/game/mario", marioGameRouter);
    // AI
    app.use("/api/ai",aiRouter)
    app.use("/api/games", gameRouter)
    // Đăng ký route quản lý từ vựng cá nhân của học viên
    app.use("/api/student/vocabulary", studentVocabularyRouter);
    // Đăng ký route học tập: Khóa học -> Bài học -> Chi tiết bài học cho học viên
    app.use("/api/student/courses", studentCourseRouter);
    app.use("/api/student/leaderboard", leaderboardRouter);
    app.use("/api/student/community", communityRouter);
    app.use("/api/student/lessons", studentLessonRouter);
    app.use("/api/student/tests", studentTestRouter);
    app.use("/api/student/notifications", notificationRouter);
    app.use("/api/student/quests", questRouter);
    // Đăng ký Swagger UI tài liệu API
    const swaggerPath = fs.existsSync(path.resolve(process.cwd(), "src/swagger-output.json"))
        ? path.resolve(process.cwd(), "src/swagger-output.json")
        : path.resolve(process.cwd(), "dist/swagger-output.json");

    if (fs.existsSync(swaggerPath)) {
        const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }

    app.use(errorHandler);
      startCronJobs();
    return app
}