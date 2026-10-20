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
router.use(Authenticate);
// Cấu hình Multer nhận file âm thanh (.wav, .mp3, .m4a, .webm, .ogg)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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


// Chấm bài viết (Writing Essay)
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

// Chấm bài nói tự do (Speaking Evaluation)
router.post(
  "/grade-speaking",
  upload.any(),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const uploadedFile = files && files.length > 0 ? files[0] : req.file;

    if (!uploadedFile) {
      throw new ApiError(400, "missing_file", "Vui lòng tải lên file ghi âm (field 'audio')");
    }
    const { topic, targetSentence } = req.body;

    let mimeType = uploadedFile.mimetype;
    if (uploadedFile.originalname.toLowerCase().endsWith(".wav") && (!mimeType || mimeType === "application/octet-stream")) {
      mimeType = "audio/wav";
    }

    const result = await aiService.gradeSpeaking(
      uploadedFile.buffer,
      mimeType,
      topic,
      targetSentence
    );
    res.status(200).json({
      success: true,
      message: "Chấm bài nói thành công",
      data: result,
    });
  })
);

// Đánh giá phát âm (GOP)
router.post(
  "/evaluate-pronunciation",
  upload.any(),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const uploadedFile = files && files.length > 0 ? files[0] : req.file;

    if (!uploadedFile) {
      throw new ApiError(400, "missing_file", "Vui lòng tải lên file âm thanh ghi âm (field 'audio')");
    }

    const { targetWord, targetIpa } = req.body;
    if (!targetWord || typeof targetWord !== "string" || targetWord.trim() === "") {
      throw new ApiError(400, "missing_params", "Vui lòng cung cấp targetWord");
    }

    console.log("Received audio buffer of length:", uploadedFile.buffer.length);
    const result = await aiService.evaluatePronunciationGOP(
      uploadedFile.buffer,
      targetWord.trim(),
      typeof targetIpa === "string" ? targetIpa.trim() : ""
    );

    res.status(200).json({
      success: true,
      message: "Chấm điểm phát âm thành công",
      data: result,
    });
  })
);

// User: Chat với AI Bot
router.post(
  "/chat",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const { message, sessionId } = req.body;
    const userId = req.user.userId;
    if (!message) throw new ApiError(400, "missing_message", "Vui lòng nhập tin nhắn");
    
    const result = await aiService.chatWithBot(userId, message, sessionId);
    res.status(200).json({
      success: true,
      message: "Chat thành công",
      data: result,
    });
  })
);

// User: Lấy danh sách lịch sử chat của mình
router.get(
  "/chat/sessions",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const userId = req.user.userId;
    const sessions = await prisma.aiChatSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20
    });
    res.status(200).json({ success: true, data: sessions });
  })
);

// User: Lấy tin nhắn trong 1 session
router.get(
  "/chat/sessions/:id",
  Authenticate,
  asyncHandler(async (req: any, res) => {
    const sessionId = parseInt(req.params.id as string);
    const userId = req.user.userId;
    
    // Check ownership
    const session = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new ApiError(403, "forbidden", "Không có quyền truy cập đoạn chat này");
    }

    const messages = await prisma.aiChatMessage.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, data: messages });
  })
);

// Admin: Thống kê tổng quan AI Chat
router.get(
  "/admin/stats",
  Authenticate,
  authorize([Role.admin]),
  asyncHandler(async (req, res) => {
    const totalSessions = await prisma.aiChatSession.count();
    const totalMessages = await prisma.aiChatMessage.count();
    const userGroups = await prisma.aiChatSession.groupBy({
      by: ['userId']
    });
    const avgMessages = totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : "0";

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalMessages,
        activeUsers: userGroups.length,
        avgMessagesPerSession: Number(avgMessages)
      }
    });
  })
);

// Admin: Lấy danh sách hội thoại (có tìm kiếm & trích đoạn tin nhắn mới nhất)
router.get(
  "/admin/sessions",
  Authenticate,
  authorize([Role.admin]),
  asyncHandler(async (req, res) => {
    const search = req.query.search ? String(req.query.search).trim() : '';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    const sessions = await prisma.aiChatSession.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true, avatarUrl: true, cefrLevel: true } },
        _count: { select: { messages: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { messageText: true, sender: true, createdAt: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 100
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
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, data: messages });
  })
);

// Admin: Xóa 1 phiên hội thoại
router.delete(
  "/admin/sessions/:id",
  Authenticate,
  authorize([Role.admin]),
  asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.id as string);
    await prisma.aiChatMessage.deleteMany({ where: { sessionId } });
    await prisma.aiChatSession.delete({ where: { id: sessionId } });
    res.status(200).json({ success: true, message: "Đã xóa cuộc hội thoại thành công" });
  })
);

export const aiRouter = router;