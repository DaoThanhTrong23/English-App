import pino from "pino";
import { env } from "../config/env.js";

export const loggers = pino({
    level: env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-prety',
        options: { colorize: true }
    }
});