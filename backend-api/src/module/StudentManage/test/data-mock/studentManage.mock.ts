export const mockStudentEntity = {
  id: 10,
  username: "student10",
  email: "student10@example.com",
  xpPoints: 300,
  isLocked: false,
  cefrLevel: "A1",
  grammarElo: 1000,
  vocabElo: 1000,
  readingElo: 1000,
  listeningElo: 1000,
  preferredTopics: "Technology",
  lastLoginDate: new Date(),
  createdAt: new Date(),
  userProgress: [
    { status: "mastered" },
    { status: "learning" },
  ],
  userTestResults: [
    { id: 1, totalScore: 80, completedAt: new Date() },
  ],
  userAchievements: [],
  acctivitylogs: [
    { createdAt: new Date() },
  ],
  _count: {
    userTestResults: 5,
    userAchievements: 2,
  },
};
