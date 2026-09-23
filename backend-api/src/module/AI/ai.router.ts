import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GradeEssaySchema } from "./ai.schema.js";
import { aiService } from "./ai.service.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import multer from "multer";
import { ApiError } from "../../shared/http/api-error.js";
import { prisma } from '../../config/prisma.js';
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { Role } from '../../generated/prisma/index.js';

const router = Router();

// Cấu hình Multer nhận file âm thanh (đặc biệt là .wav, .mp3, .m4a, .webm, .ogg)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // Tăng giới hạn lên 20MB (WAV thường nặng hơn mp3)
  fileFilter: (_req, file, cb) => {
    const isAudioMime = file.mimetype.startsWith("audio/") || 
                        file.mimetype.includes("webm") || 
                        file.mimetype.includes("wav") ||
                        file.mimetype.includes("wave") ||
                        file.mimetype.includes("octet-stream");
    const isAudioExt = /\.(wav|mp3|m4a|webm|ogg|aac|3gp|flac)$/i.test(file.originalname);
    if (isAudioMime || isAudioExt) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "invalid_file", "Chỉ chấp nhận file âm thanh (.wav, .mp3, .m4a, .webm)"));
    }
  },
});

// router.use(authorize);
router.post(
  "/grade-essay",
  validate(GradeEssaySchema),
  asyncHandler(async (req, res) => {
    const result = await aiService.gradeEssay(req.body);
    res.status(200).json({
      success: true,
      message: "Chấm bài thành công",
      data: result,
    });
  })
);

// Admin: Lấy danh sách hội thoại
router.get(
  "/admin/sessions",
  Authenticate,
  authorize([Role.admin]),
  asyncHandler(async (req, res) => {
    const sessions = await prisma.aiChatSession.findMany({
      include: {
        user: { select: { username: true, email: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: 50
    });
    res.status(200).json({ success: true, data: sessions });
  })
);

// Admin: Lấy chi tiết tin nhắn của một phiên
router.get(
  "/admin/sessions/:id/messages",
  Authenticate,
  authorize([Role.admin]),
  asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.id as string);
    const messages = await prisma.aiChatMessage.findMany({
      where: { sessionId: sessionId }, // Using sessionId directly
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, data: messages });
  })
);

export const aiRouter = router;