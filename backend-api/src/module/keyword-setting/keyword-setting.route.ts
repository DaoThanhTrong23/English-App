import { Router } from "express";
import { Authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/index.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { keywordSettingService } from "./keyword-setting.service.js";

export const keywordRouter = Router();

// Toàn bộ route cài đặt keyword dành cho Admin
keywordRouter.use(Authenticate, authorize([Role.admin]));

/**
 * GET /api/admin/keywords - Lấy toàn bộ danh sách nhóm từ khóa đồng nghĩa
 */
keywordRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = keywordSettingService.getAll();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách nhóm từ khóa thành công",
      data
    });
  })
);

/**
 * GET /api/admin/keywords/download - Tải về file synonyms.csv
 */
keywordRouter.get(
  "/download",
  asyncHandler(async (req, res) => {
    const filePath = keywordSettingService.getCsvFilePath();
    res.download(filePath, "synonyms.csv");
  })
);

/**
 * POST /api/admin/keywords - Thêm nhóm từ khóa mới
 */
keywordRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { group, keywords } = req.body;
    const kwList = Array.isArray(keywords)
      ? keywords
      : typeof keywords === "string"
      ? keywords.split(",").map(k => k.trim())
      : [];

    const result = keywordSettingService.createGroup(group, kwList);
    res.status(201).json({
      success: true,
      message: "Thêm nhóm từ khóa thành công",
      data: result
    });
  })
);

/**
 * PUT /api/admin/keywords/:id - Cập nhật nhóm từ khóa
 */
keywordRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { group, keywords } = req.body;
    const kwList = Array.isArray(keywords)
      ? keywords
      : typeof keywords === "string"
      ? keywords.split(",").map(k => k.trim())
      : [];

    const result = keywordSettingService.updateGroup(id, group, kwList);
    res.status(200).json({
      success: true,
      message: "Cập nhật nhóm từ khóa thành công",
      data: result
    });
  })
);

/**
 * DELETE /api/admin/keywords/:id - Xóa nhóm từ khóa
 */
keywordRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    keywordSettingService.deleteGroup(id);
    res.status(200).json({
      success: true,
      message: "Xóa nhóm từ khóa thành công"
    });
  })
);
