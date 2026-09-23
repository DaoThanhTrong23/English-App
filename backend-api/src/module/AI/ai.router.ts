import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { GradeEssaySchema } from "./ai.schema.js";
import { aiService } from "./ai.service.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import multer from "multer";
import { ApiError } from "../../shared/http/api-error.js";

const router = Router();

// Cấu hình Multer nhận file âm thanh (đặc biệt là .wav, .mp3, .m4a, .webm, .ogg)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // Tăng giới hạn lên 20MB (WAV thường nặng hơn mp3)
  fileFilter: (_req, file, cb) => {
    const isAudioMime = file.mimetype.startsWith("audio/") || 
                        file.mimetype.includes("webm") || 
                        file.mimetype.includes("wav") ||
                        file.mimetype.includes("wave") ||
                        file.mimetype.includes("octet-stream");
    const isAudioExt = /\.(wav|mp3|m4a|webm|ogg|aac|3gp|flac)$/i.test(file.originalname);
    if (isAudioMime || isAudioExt) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "invalid_file", "Chỉ chấp nhận file âm thanh (.wav, .mp3, .m4a, .webm)"));
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
  upload.any(),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const uploadedFile = files && files.length > 0 ? files[0] : req.file;

    if (!uploadedFile) {
      throw new ApiError(400, "missing_file", "Vui lòng tải lên file ghi âm (field 'audio')");
    }
    const { topic, targetSentence } = req.body;
    
    let mimeType = uploadedFile.mimetype;
    if (uploadedFile.originalname.toLowerCase().endsWith(".wav") && (!mimeType || mimeType === "application/octet-stream")) {
      mimeType = "audio/wav";
    }

    const result = await aiService.gradeSpeaking(
      uploadedFile.buffer,
      mimeType,
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