import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GradeEssaySchema } from "./ai.schema.js";
import { aiService } from "./ai.service.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { prisma } from '../../config/prisma.js';
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { Role } from '../../generated/prisma/index.js';

const router = Router();
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