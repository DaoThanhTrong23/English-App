import z from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    JWT_ACCESS_SECRET: z.string().default("access_secret_key_default_123456"),
    JWT_ACCESS_EXPIRES_IN: z.number().int().default(900000),
    JWT_REFRESH_SECRET: z.string().default("refresh_secret_key_default_654321"),
    JWT_REFRESH_EXPIRES_IN: z.number().int().default(604800000),
});

export const env = envSchema.parse(process.env);
