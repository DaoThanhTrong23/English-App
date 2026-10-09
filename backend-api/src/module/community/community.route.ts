import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { communityService } from "./community.service.js";

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
  asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.userId);
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Nội dung trống" });
    const result = await communityService.createPost(userId, content);
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
