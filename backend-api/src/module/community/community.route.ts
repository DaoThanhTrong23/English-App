import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { communityService } from "./community.service.js";

// Đảm bảo thư mục uploads/posts tồn tại
const postUploadDir = path.join(process.cwd(), "uploads", "posts");
if (!fs.existsSync(postUploadDir)) {
  fs.mkdirSync(postUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const communityRouter = Router();

communityRouter.use(Authenticate);

communityRouter.get(
  "/posts",
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const limit = Number(req.query.limit) || 20;
    const result = await communityService.getPosts(userId, limit);
    res.status(200).json({ success: true, data: result });
  })
);

communityRouter.post(
  "/posts",
  upload.single("image"),
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const content = req.body?.content || "";
    
    let imageUrl: string | undefined = undefined;
    if (req.file) {
      imageUrl = `/uploads/posts/${req.file.filename}`;
    }

    if (!content.trim() && !imageUrl) {
      return res.status(400).json({ success: false, message: "Bài viết phải có nội dung văn bản hoặc hình ảnh" });
    }

    const result = await communityService.createPost(userId, content.trim(), imageUrl);
    res.status(201).json({ success: true, data: result });
  })
);

communityRouter.post(
  "/posts/:id/like",
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const postId = Number(req.params.id);
    const result = await communityService.toggleLike(userId, postId);
    res.status(200).json({ success: true, data: result });
  })
);

communityRouter.get(
  "/posts/:id/comments",
  asyncHandler(async (req, res) => {
    const postId = Number(req.params.id);
    const result = await communityService.getComments(postId);
    res.status(200).json({ success: true, data: result });
  })
);

communityRouter.post(
  "/posts/:id/comments",
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const postId = Number(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Nội dung trống" });
    const result = await communityService.createComment(userId, postId, content);
    res.status(201).json({ success: true, data: result });
  })
);
