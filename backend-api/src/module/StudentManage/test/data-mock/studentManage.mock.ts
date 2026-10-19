export const mockStudentEntity = {
  id: 10,
  username: "student10",
  email: "student10@example.com",
  xpPoints: 300,
  isLocked: false,
  lastLoginDate: new Date(),
  createdAt: new Date(),
  userProgress: [
    { status: "mastered" },
    { status: "learning" },
  ],
  acctivitylogs: [
    { createdAt: new Date() },
  ],
  _count: {
    userTestResults: 5,
    userAchievements: 2,
  },
};
