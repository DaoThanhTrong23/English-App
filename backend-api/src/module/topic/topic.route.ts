import { Router } from "express";
import { topicService } from "./topic.service.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/index.js";
import { validate } from "../../middleware/validate.middleware.js";
import { CreateTopicSchema, UpdateTopicSchema } from "./topic.schema.js";

const topicRouter = Router();

topicRouter.use(Authenticate, authorize([Role.admin]));

topicRouter.get("/", asyncHandler(async (req, res) => {
  const topics = await topicService.getAllTopics();
  res.status(200).json({ success: true, data: topics });
}));

topicRouter.get("/:id", asyncHandler(async (req, res) => {
  const topic = await topicService.getTopicById(parseInt(req.params.id as string));
  res.status(200).json({ success: true, data: topic });
}));

topicRouter.post("/", validate(CreateTopicSchema), asyncHandler(async (req, res) => {
  const topic = await topicService.createTopic(req.body);
  res.status(201).json({ success: true, message: "Tạo chủ đề thành công", data: topic });
}));

topicRouter.put("/:id", validate(UpdateTopicSchema), asyncHandler(async (req, res) => {
  const topic = await topicService.updateTopic(parseInt(req.params.id as string), req.body);
  res.status(200).json({ success: true, message: "Cập nhật thành công", data: topic });
}));

topicRouter.delete("/:id", asyncHandler(async (req, res) => {
  await topicService.deleteTopic(parseInt(req.params.id as string));
  res.status(200).json({ success: true, message: "Xóa thành công" });
}));

export { topicRouter };
