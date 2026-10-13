import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

import { studentLessonRepository } from "../student-lesson/student-lesson.repository.js";
import { BcryptCompare } from "../../utils/hash.js";

// Đảm bảo thư mục uploads/avatars tồn tại
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
export const profileRouter = Router();

profileRouter.use(Authenticate);

profileRouter.get("/me", asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      xpPoints: true,
      cefrLevel: true,
      onboardingCompleted: true,
    }
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const [masteredWordsCount, completedTestsCount, achievementsCount, streak] = await Promise.all([
    prisma.userProgress.count({ where: { userId, status: 'mastered' } }),
    prisma.userTestResult.count({ where: { userId, totalScore: { gt: 0 } } }),
    prisma.userAchievement.count({ where: { userId } }),
    studentLessonRepository.calculateUserStreak(userId)
  ]);

  res.status(200).json({ 
    success: true, 
    data: {
      ...user,
      masteredWordsCount,
      completedTestsCount,
      achievementsCount,
      streak
    } 
  });
}));


profileRouter.put("/update", upload.single("avatar"), asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  const { username } = req.body;
  
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const updateData: any = {};
  if (username) {
    updateData.username = username;
  }
  
  // Nếu có file upload lên, tạo URL tĩnh
  if (req.file) {
    updateData.avatarUrl = "/uploads/avatars/" + req.file.filename;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, email: true, avatarUrl: true, cefrLevel: true, xpPoints: true }
  });

  res.status(200).json({
    success: true,
    message: "Cập nhật hồ sơ thành công",
    data: updatedUser
  });
}));


profileRouter.get("/history", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  // 1. Lấy kết quả các bài kiểm tra bài học thực tế mà học viên đã làm
  const testResults = await prisma.userTestResult.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: 30,
    include: {
      test: {
        include: {
          lesson: {
            select: { title: true }
          }
        }
      }
    }
  });

  // 2. Lấy lịch sử làm bài đánh giá FAME-KT
  const assessmentHistory = await prisma.assessmentHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      question: {
        select: { quesionText: true, skillCategory: true, points: true }
      }
    }
  });

  res.status(200).json({ 
    success: true, 
    data: {
      testResults,
      assessmentHistory
    } 
  });
}));

profileRouter.get("/achievements", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const streak = await studentLessonRepository.calculateUserStreak(userId);
  const userXp = user?.xpPoints || 0;

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { requireXp: 'asc' }
  });

  // Tự động kiểm tra và mở khóa các thành tựu học viên đã đủ điều kiện
  for (const ach of allAchievements) {
    if (userXp >= ach.requireXp && streak >= ach.requireStreak) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: ach.id
          }
        },
        create: {
          userId,
          achievementId: ach.id
        },
        update: {}
      });
    }
  }

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true
    }
  });
  
  res.status(200).json({ 
    success: true, 
    data: { userAchievements, allAchievements } 
  });
}));

profileRouter.get("/saved-words", asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const savedWords = await prisma.userProgress.findMany({
    where: { userId, status: 'mastered' },
    include: {
      word: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.status(200).json({ success: true, data: savedWords });
}));


// Khóa tài khoản: Yêu cầu người dùng xác nhận bằng mật khẩu
profileRouter.post("/lock-account", Authenticate, asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  const { password } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu để xác nhận khóa tài khoản!" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
  }

  const isMatch = await BcryptCompare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Mật khẩu xác nhận không chính xác!" });
  }

  // Khóa tài khoản và xóa refresh tokens để đăng xuất ngay lập tức
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isLocked: true }
    }),
    prisma.refreshToken.deleteMany({
      where: { userId }
    })
  ]);

  res.status(200).json({
    success: true,
    message: "Tài khoản của bạn đã được khóa thành công. Bạn cần liên hệ Quản trị viên để được mở khóa!"
  });
}));

// Compliance: Xóa tài khoản (GDPR / App Store Policy)
profileRouter.delete("/delete-account", Authenticate, asyncHandler(async (req: AuthenticateRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  // Prisma sẽ tự động xóa các bảng liên quan nhờ onDelete: Cascade
  await prisma.user.delete({
    where: { id: userId }
  });

  res.status(200).json({
    success: true,
    message: "Tài khoản và toàn bộ dữ liệu đã được xóa vĩnh viễn"
  });
}));
