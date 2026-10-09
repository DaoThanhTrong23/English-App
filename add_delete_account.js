const fs = require('fs');
const file = 'backend-api/src/module/auth/profile.route.ts';
let code = fs.readFileSync(file, 'utf8');

const deleteRoute = `
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
`;

if (!code.includes('/delete-account')) {
  code = code + '\n' + deleteRoute;
  fs.writeFileSync(file, code);
}
