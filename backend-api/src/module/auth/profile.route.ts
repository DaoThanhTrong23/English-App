import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Authenticate, AuthenticateRequest } from "../../middleware/authenticate.middleware.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../shared/http/async-handler.js";

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
