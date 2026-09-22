import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GradeEssaySchema } from "./ai.schema.js";
import { aiService } from "./ai.service.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import multer from "multer";
import { ApiError } from "../../shared/http/api-error.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
  fileFilter: (_req, file, cb) => {
    // Chấp nhận các định dạng audio từ Web/Mobile: mp3, wav, m4a, ogg, webm, aac, 3gp
    if (file.mimetype.startsWith("audio/") || file.mimetype.includes("webm") || file.mimetype.includes("octet-stream")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "invalid_file", "Chỉ chấp nhận file âm thanh (mp3, wav, m4a, webm)"));
    }
  },
});
// router.use(authorize);
router.post(
  "/grade-essay",
  validate(GradeEssaySchema),
  asyncHandler(async (req, res) => {
    const result = await aiService.gradeEssay(req.body);
    res.status(200).json({
      success: true,
      message: "Chấm bài thành công",
      data: result,
    });
  })
);

router.post(
  "/grade-speaking",
  upload.single("audio"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "missing_file", "Vui lòng tải lên file ghi âm (field 'audio')");
    }
    const { topic, targetSentence } = req.body;
    const result = await aiService.gradeSpeaking(
      req.file.buffer,
      req.file.mimetype,
      topic,
      targetSentence
    );
    res.status(200).json({
      success: true,
      message: "Chấm bài nói thành công",
      data: result,
    });
  })
);


export const aiRouter = router;