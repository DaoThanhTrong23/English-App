import crypto from "node:crypto";
import { env } from "../config/env.js";

export interface AIScorePayload {
  userId: number;
  questionId: number;
  scorePercent: number;
  timestamp: number;
}

const SECRET = env.JWT_ACCESS_SECRET || "fallback_ai_secret_key";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 phút hiệu lực

/**
 * Tạo token chấm điểm AI kèm chữ ký HMAC-SHA256
 */
export function generateAIScoreToken(payload: Omit<AIScorePayload, "timestamp">): string {
  const data: AIScorePayload = {
    ...payload,
    timestamp: Date.now(),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Xác thực token chấm điểm AI
 */
export function verifyAIScoreToken(
  token: string,
  expectedUserId: number,
  expectedQuestionId?: number
): { valid: boolean; scorePercent?: number; reason?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "invalid_format" };
    }

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payloadBase64)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return { valid: false, reason: "invalid_signature" };
    }

    const payload: AIScorePayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8")
    );

    // Kiểm tra hết hạn (15 phút)
    if (Date.now() - payload.timestamp > TOKEN_TTL_MS) {
      return { valid: false, reason: "token_expired" };
    }

    // Kiểm tra đúng User
    if (payload.userId !== expectedUserId) {
      return { valid: false, reason: "user_mismatch" };
    }

    // Kiểm tra đúng Question nếu có
    if (expectedQuestionId && payload.questionId !== expectedQuestionId) {
      return { valid: false, reason: "question_mismatch" };
    }

    return { valid: true, scorePercent: payload.scorePercent };
  } catch (error) {
    return { valid: false, reason: "malformed_token" };
  }
}
