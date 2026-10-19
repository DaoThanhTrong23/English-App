export const mockActivityItem = {
  id: 1,
  userId: 10,
  actionType: "USER_LOGIN",
  description: "Người dùng student10 đăng nhập thành công",
  createdAt: new Date(),
  user: {
    id: 10,
    username: "student10",
    email: "student10@example.com",
    role: "user",
  },
};

export const mockLoginLogItem = {
  id: 1,
  userId: 10,
  ipAddress: "127.0.0.1",
  deviceInfo: "Chrome Mac",
  loginTime: new Date(),
  user: {
    id: 10,
    username: "student10",
    email: "student10@example.com",
  },
};
