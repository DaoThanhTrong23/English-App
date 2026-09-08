import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loggers } from "./utils/logger.js";
import { errorHandler } from "./shared/http/error-handler.js";
import bubbleGameRouter from "./module/module-bubble-game/bubble-game.route.js";
export function createapp()  {
    const app = express();

    app.disable("x-powered-by");
    app.use(pinoHttp({ logger: loggers}))
    app.use(helmet());
    app.use(cors({ origin: env.CORS_ORIGIN, credentials: false}));

    // Giới hạn 100kb/request json
    app.use(express.json({ limit: '100 kb'}));

    // Giới hạn 100 req 1 phút
    app.use(rateLimit({
        limit: 100,
        windowMs: 60_000,
        standardHeaders: 'draft-8',
        legacyHeaders: false
    }));

    // Đăng ký route game
    app.use("/game", bubbleGameRouter);

    app.use(errorHandler);
    return app 
}