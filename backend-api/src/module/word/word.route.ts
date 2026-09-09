import { Router, Request, Response } from 'express';
import { wordService } from './word.service.js';
import { getWordsQuerySchema, createWordSchema, updateWordSchema } from './word.schema.js';
import { asyncHandler } from "../../shared/http/async-handler.js";

const router = Router();

// LẤY DS ,TÌM KIẾM
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const query = getWordsQuerySchema.parse(req.query);
  const result = await wordService.fetchWords(parseInt(query.page), parseInt(query.limit), query.cefrLevel, query.search);
  res.status(200).json({ success: true, ...result });
}));

// THÊM MỚI
router.post('/', asyncHandler(async (req, res) => {
  const data = createWordSchema.parse(req.body);
  const word = await wordService.createWord(data);
  res.status(201).json({ message: 'Thêm từ vựng thành công', data: word });
}));

// SỬA
router.put('/:id', asyncHandler(async (req, res) => {
  const data = updateWordSchema.parse(req.body);
  
  const id = req.params.id as string; 
  
  const word = await wordService.updateWord(id, data);
  res.status(200).json({ message: 'Sửa từ vựng thành công', data: word });
}));

// XÓA
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string; 
  
  await wordService.deleteWord(id);
  res.status(200).json({ message: 'Xóa từ vựng thành công' });
}));
export const wordRouter = router;