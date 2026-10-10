const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

const oldPrompt = `Văn bản học viên đã nói:
  """
  \${transcript}
  """
  Hãy đánh giá và trả về kết quả ĐÚNG định dạng JSON sau`;

const newPrompt = `Văn bản học viên đã nói (được AI bóc băng):
  """
  \${transcript}
  """
  LƯU Ý CHẤM ĐIỂM (RẤT QUAN TRỌNG):
  1. Không bao giờ cho 10/10 trừ khi bài nói xuất sắc xuất chúng như người bản xứ, từ vựng C2, ngữ pháp phức tạp.
  2. Nếu học viên nói quá ngắn (dưới 10 từ) hoặc chỉ lặp lại y hệt câu mẫu, hãy cho TỐI ĐA 5.0 điểm.
  3. Mức điểm trung bình cho câu trả lời thông thường, đúng ngữ pháp cơ bản chỉ ở mức 6.0 - 7.5.
  4. Trừ điểm nặng tay nếu nội dung lạc đề hoặc không tự nhiên.
  
  Hãy đánh giá nghiêm khắc và trả về kết quả ĐÚNG định dạng JSON sau`;

code = code.replace(oldPrompt, newPrompt);
fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
