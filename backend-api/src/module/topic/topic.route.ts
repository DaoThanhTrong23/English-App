import { Router } from "express";
import { topicService } from "./topic.service.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { CreateTopicSchema, UpdateTopicSchema } from "./topic.schema.js";

const topicRouter = Router();

topicRouter.use(Authenticate);

topicRouter.get("/", requirePermission(PermissionName.READ_TOPIC_LIST), asyncHandler(async (req, res) => {
  const cefrLevel = req.query.cefrLevel as string;
  const topics = await topicService.getAllTopics(cefrLevel);
  res.status(200).json({ success: true, data: topics });
}));

topicRouter.get("/:id", requirePermission(PermissionName.READ_TOPIC_DETAIL), asyncHandler(async (req, res) => {
  const topic = await topicService.getTopicById(parseInt(req.params.id as string));
  res.status(200).json({ success: true, data: topic });
}));

topicRouter.post("/", requirePermission(PermissionName.CREATE_TOPIC), validate(CreateTopicSchema), asyncHandler(async (req, res) => {
  const topic = await topicService.createTopic(req.body);
  res.status(201).json({ success: true, message: "Tạo chủ đề thành công", data: topic });
}));

topicRouter.put("/:id", requirePermission(PermissionName.UPDATE_TOPIC), validate(UpdateTopicSchema), asyncHandler(async (req, res) => {
  const topic = await topicService.updateTopic(parseInt(req.params.id as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật thành công", data: topic });
}));

topicRouter.delete("/:id", requirePermission(PermissionName.DELETE_TOPIC), asyncHandler(async (req, res) => {
  await topicService.deleteTopic(parseInt(req.params.id as string));
  res.status(200).json({ success: true, message: "Xóa chủ đề thành công" });
}));

topicRouter.patch("/:id/restore", requirePermission(PermissionName.UPDATE_TOPIC), asyncHandler(async (req, res) => {
  const topic = await topicService.restoreTopic(parseInt(req.params.id as string));
  res.status(200).json({ success: true, message: "Khôi phục chủ đề thành công", data: topic });
}));

export { topicRouter };
