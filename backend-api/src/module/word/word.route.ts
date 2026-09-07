import { Router, Request, Response } from 'express';
import { wordService } from './word.service';
import { getWordsQuerySchema } from './word.schema';

const router = Router();

// API: GET /api/words
router.get('/', async (req: Request, res: Response) => {
  // 1. Kiểm tra đầu vào (Nếu lỗi, Express 5 sẽ tự bắt và báo lỗi 400/500)
  const query = getWordsQuerySchema.parse(req.query);
  const page = parseInt(query.page);
  const limit = parseInt(query.limit);
  
  // 2. Gọi service lấy data
  const result = await wordService.fetchWords(page, limit, query.cefrLevel);
  
  // 3. Trả về thành công
  res.status(200).json({
    success: true,
    ...result
  });
});

export const wordRouter = router;