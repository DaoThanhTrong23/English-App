export const mockValidUser = {
  id: 1,
  username: "teststudent",
  email: "student@example.com",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklm",
  role: "user" as const,
  isLocked: false,
  xpPoints: 150,
  cefrLevel: "B1",
  onboardingCompleted: true,
  avatarUrl: null,
  job: "Engineer",
  interests: "Coding, AI",
  grammarElo: 1250,
  vocabElo: 1200,
  readingElo: 1300,
  listeningElo: 1150,
  preferredTopics: "Technology",
  lastLoginDate: new Date(),
  createdAt: new Date(),
};

export const mockLockedUser = {
  ...mockValidUser,
  id: 2,
  username: "lockeduser",
  email: "locked@example.com",
  isLocked: true,
};

export const mockAdminUser = {
  ...mockValidUser,
  id: 99,
  username: "superadmin",
  email: "admin@example.com",
  role: "admin" as const,
};

export const mockRegisterInput = {
  username: "newuser99",
  email: "newuser99@example.com",
  password: "Password123@",
  deviceInfo: "Chrome Mac OS",
};

export const mockLoginInput = {
  identifier: "student@example.com",
  password: "Password123@",
  deviceInfo: "iPhone Safari",
};
