const fs = require('fs');
const file = 'backend-api/src/module/auth/auth.route.ts';
let code = fs.readFileSync(file, 'utf8');

const forgotPwLogic = `
// GIẢ LẬP LƯU TRỮ OTP (Trong thực tế nên dùng Redis hoặc DB table riêng)
const otpCache = new Map<string, { otp: string, expires: number }>();

Authrouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
  
  const user = await authService.repo.prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });

  // Tạo OTP ngẫu nhiên 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(email, { otp, expires: Date.now() + 15 * 60 * 1000 }); // 15 phút

  // Log ra console để test (Trong thực tế sẽ dùng Nodemailer gửi email)
  console.log(\`[MOCK EMAIL] Gửi OTP \${otp} đến email \${email} để reset mật khẩu.\`);

  res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn (Vui lòng kiểm tra console log)' });
}));

Authrouter.post('/reset-password', asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

  const record = otpCache.get(email);
  if (!record) return res.status(400).json({ success: false, message: 'OTP không tồn tại hoặc đã hết hạn' });
  if (Date.now() > record.expires) {
    otpCache.delete(email);
    return res.status(400).json({ success: false, message: 'OTP đã hết hạn' });
  }
  if (record.otp !== otp) return res.status(400).json({ success: false, message: 'OTP không chính xác' });

  // Hash mật khẩu mới và lưu
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await authService.repo.prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  otpCache.delete(email);
  res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
}));
`;

if (!code.includes('/forgot-password')) {
  code = code.replace(/export default Authrouter;/, forgotPwLogic + '\nexport default Authrouter;');
  fs.writeFileSync(file, code);
}
