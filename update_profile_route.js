const fs = require('fs');
const path = 'backend-api/src/module/auth/profile.route.ts';
let code = fs.readFileSync(path, 'utf8');

const newRoutes = `

profileRouter.get("/history", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const history = await prisma.assessmentHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      question: {
        select: { quesionText: true, skillCategory: true, points: true }
      }
    }
  });
  res.status(200).json({ success: true, data: history });
}));

profileRouter.get("/achievements", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true
    }
  });
  
  // Lấy thêm danh sách achievement chưa đạt
  const allAchievements = await prisma.achievement.findMany();
  
  res.status(200).json({ 
    success: true, 
    data: { userAchievements, allAchievements } 
  });
}));

profileRouter.get("/saved-words", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const savedWords = await prisma.userProgress.findMany({
    where: { userId, status: 'learned' },
    include: {
      word: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.status(200).json({ success: true, data: savedWords });
}));
`;

if (!code.includes('/history')) {
  code += newRoutes;
  fs.writeFileSync(path, code);
}
