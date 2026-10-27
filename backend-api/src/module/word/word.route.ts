import { Router, Request, Response } from 'express';
import { wordService } from './word.service.js';
import { getWordsQuerySchema, createWordSchema, updateWordSchema, createBulkWordSchema } from './word.schema.js';
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requirePermission } from "../../middleware/authorize.middleware.js";
import { PermissionName } from '../../generated/prisma/index.js';
import { Authenticate } from "../../middleware/authenticate.middleware.js";

const router = Router();

// Xác thực đăng nhập
router.use(Authenticate);

router.get('/totalWord', requirePermission(PermissionName.READ_WORD_COUNT), asyncHandler(async (req, res) => {
  const result = await wordService.countWord();
  res.status(200).json({ success: true, message: "lấy tổng từ vựng", data: result });
}));

// LẤY DS ,TÌM KIẾM
router.get('/', requirePermission(PermissionName.READ_WORD_LIST), asyncHandler(async (req: Request, res: Response) => {
  const query = getWordsQuerySchema.parse(req.query);
  const result = await wordService.fetchWords(query);
  res.status(200).json({ success: true, ...result });
}));

// THÊM HÀNG LOẠT
router.post('/bulk', requirePermission(PermissionName.CREATE_WORD_BULK), asyncHandler(async (req, res) => {
  const data = createBulkWordSchema.parse(req.body);
  const result = await wordService.createBulkWords(data);
  res.status(201).json({ message: 'Thêm hàng loạt từ vựng thành công', data: result });
}));

// THÊM MỚI
router.post('/', requirePermission(PermissionName.CREATE_WORD), asyncHandler(async (req, res) => {
  const data = createWordSchema.parse(req.body);
  const word = await wordService.createWord(data);
  res.status(201).json({ message: 'Thêm từ vựng thành công', data: word });
}));

// SỬA
router.put('/:id', requirePermission(PermissionName.UPDATE_WORD), asyncHandler(async (req, res) => {
  const data = updateWordSchema.parse(req.body);
  const id = req.params.id as string; 
  const word = await wordService.updateWord(id, data);
  res.status(200).json({ message: 'Sửa từ vựng thành công', data: word });
}));

// XÓA MỀM
router.delete('/:id', requirePermission(PermissionName.DELETE_WORD), asyncHandler(async (req, res) => {
  const id = req.params.id as string; 
  await wordService.deleteWord(id);
  res.status(200).json({ success: true, message: 'Xóa từ vựng thành công' });
}));

// KHÔI PHỤC TỪ VỰNG
router.patch('/:id/restore', requirePermission(PermissionName.UPDATE_WORD), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const word = await wordService.restoreWord(id);
  res.status(200).json({ success: true, message: 'Khôi phục từ vựng thành công', data: word });
}));

export const wordRouter = router;
