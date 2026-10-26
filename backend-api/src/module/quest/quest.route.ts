import { Router } from "express";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

export const questRouter = Router();

questRouter.use(Authenticate);

interface QuestConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  xpReward: number;
}

const QUEST_DEFINITIONS: QuestConfig[] = [
  {
    id: "quest_login",
    title: "Điểm danh ngày mới",
    description: "Đăng nhập ứng dụng và sẵn sàng học tập",
    icon: "sunny",
    target: 1,
    xpReward: 10,
  },
  {
    id: "quest_test",
    title: "Chiến binh tri thức",
    description: "Hoàn thành ít nhất 1 bài luyện tập hoặc kiểm tra",
    icon: "book",
    target: 1,
    xpReward: 20,
  },
  {
    id: "quest_game",
    title: "Cao thủ giải trí",
    description: "Chơi 1 ván mini-game (Mario, Nối từ, Lật thẻ)",
    icon: "game-controller",
    target: 1,
    xpReward: 15,
  },
];

/**
 * 1. Lấy danh sách nhiệm vụ hằng ngày và tiến độ hôm nay của học viên
 */
questRouter.get("/daily", requirePermission(PermissionName.READ_QUEST_LIST), asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Lấy tiến độ hoạt động hôm nay
  const [testCountToday, gameCountToday, claimedLogs] = await Promise.all([
    // Số bài test hoàn thành hôm nay
    prisma.userTestResult.count({
      where: {
        userId,
        completedAt: { gte: startOfToday },
        totalScore: { gt: 0 },
      },
    }),
    // Số ván game chơi hôm nay
    prisma.gameHistory.count({
      where: {
        userId,
        createdAt: { gte: startOfToday },
      },
    }),
    // Lịch sử nhận thưởng hôm nay
    prisma.activityLog.findMany({
      where: {
        userId,
        actionType: { startsWith: "CLAIM_DAILY_QUEST_" },
        createdAt: { gte: startOfToday },
      },
      select: { actionType: true },
    }),
  ]);

  const claimedSet = new Set(claimedLogs.map((l) => l.actionType));

  const quests = QUEST_DEFINITIONS.map((def) => {
    let current = 0;
    if (def.id === "quest_login") {
      current = 1; // Đang gọi API tức là đã đăng nhập thành công
    } else if (def.id === "quest_test") {
      current = testCountToday;
    } else if (def.id === "quest_game") {
      current = gameCountToday;
    }

    const isCompleted = current >= def.target;
    const isClaimed = claimedSet.has(`CLAIM_DAILY_QUEST_${def.id.toUpperCase()}`);

    return {
      ...def,
      current: Math.min(current, def.target),
      isCompleted,
      isClaimed,
    };
  });

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const claimedCount = quests.filter((q) => q.isClaimed).length;

  res.status(200).json({
    success: true,
    data: {
      quests,
      totalQuests: quests.length,
      completedCount,
      claimedCount,
    },
  });
}));

/**
 * 2. Nhận thưởng XP cho nhiệm vụ đã hoàn thành
 */
questRouter.post("/claim", requirePermission(PermissionName.UPDATE_QUEST_CLAIM), asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { questId } = req.body;
  const questDef = QUEST_DEFINITIONS.find((q) => q.id === questId);
  if (!questDef) {
    return res.status(400).json({ success: false, message: "Nhiệm vụ không hợp lệ" });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const actionType = `CLAIM_DAILY_QUEST_${questDef.id.toUpperCase()}`;

  // Kiểm tra đã nhận hôm nay chưa
  const alreadyClaimed = await prisma.activityLog.findFirst({
    where: {
      userId,
      actionType,
      createdAt: { gte: startOfToday },
    },
  });

  if (alreadyClaimed) {
    return res.status(400).json({ success: false, message: "Hôm nay bạn đã nhận phần thưởng này rồi!" });
  }

  // Kiểm tra đã hoàn thành điều kiện chưa
  let canClaim = false;
  if (questDef.id === "quest_login") {
    canClaim = true;
  } else if (questDef.id === "quest_test") {
    const testCount = await prisma.userTestResult.count({
      where: {
        userId,
        completedAt: { gte: startOfToday },
        totalScore: { gt: 0 },
      },
    });
    canClaim = testCount >= questDef.target;
  } else if (questDef.id === "quest_game") {
    const gameCount = await prisma.gameHistory.count({
      where: {
        userId,
        createdAt: { gte: startOfToday },
      },
    });
    canClaim = gameCount >= questDef.target;
  }

  if (!canClaim) {
    return res.status(400).json({ success: false, message: "Bạn chưa hoàn thành mục tiêu nhiệm vụ này!" });
  }

  // Cộng XP và lưu log nhận thưởng
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { xpPoints: { increment: questDef.xpReward } },
      select: { id: true, username: true, xpPoints: true },
    }),
    prisma.activityLog.create({
      data: {
        userId,
        actionType,
        description: `Nhận phần thưởng nhiệm vụ "${questDef.title}": +${questDef.xpReward} XP`,
      },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: `Nhận thưởng thành công! Bạn được cộng +${questDef.xpReward} XP.`,
    data: {
      questId: questDef.id,
      xpAwarded: questDef.xpReward,
      totalXp: updatedUser.xpPoints,
    },
  });
}));
