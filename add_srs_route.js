const fs = require('fs');
const file = 'backend-api/src/module/student-vocabulary/student-vocabulary.route.ts';
let code = fs.readFileSync(file, 'utf8');

const srsRoutes = `
/**
 * GET /due-reviews - Lấy danh sách từ vựng đến hạn ôn tập (Spaced Repetition)
 */
router.get(
  "/reviews/due",
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const result = await studentVocabularyService.getDueReviews(userId);
    res.status(200).json({ success: true, data: result });
  })
);

/**
 * POST /reviews - Nộp kết quả ôn tập từ vựng
 */
router.post(
  "/reviews",
  asyncHandler(async (req: AuthenticateRequest, res) => {
    const userId = Number(req.user?.userId);
    const { wordId, isCorrect } = req.body;
    if (!wordId || isCorrect === undefined) {
      return res.status(400).json({ success: false, message: "Thiếu wordId hoặc isCorrect" });
    }
    const result = await studentVocabularyService.submitReview(userId, Number(wordId), Boolean(isCorrect));
    res.status(200).json({ success: true, data: result });
  })
);
`;

if (!code.includes('/reviews/due')) {
  // Insert before module export
  code = code.replace(/export const studentVocabularyRouter = router;/, srsRoutes + '\nexport const studentVocabularyRouter = router;');
  fs.writeFileSync(file, code);
}
