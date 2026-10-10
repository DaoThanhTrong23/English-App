const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

const promptStart = 'const prompt = `Bạn là giám khảo chấm thi Nói tiếng Anh chuẩn quốc tế';
const promptEnd = 'const response = await ollama.chat({';

const startIndex = code.indexOf(promptStart);
const endIndex = code.indexOf(promptEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newPrompt = `const prompt = \`Bạn là chuyên gia chấm điểm phát âm tiếng Anh.
  Dưới đây là văn bản được bóc băng từ giọng nói của học viên (transcript):
  \${topic ? \`Chủ đề: "\${topic}"\` : ""}
  \${targetSentence ? \`Câu gốc cần đọc: "\${targetSentence}"\` : ""}
  
  Văn bản học viên thực tế đã nói:
  """
  \${transcript}
  """
  
  LƯU Ý CHẤM ĐIỂM (BÀI TẬP ĐỌC THEO MẪU - READ ALOUD):
  1. Hãy đối chiếu từng từ của "Văn bản học viên thực tế đã nói" với "Câu gốc cần đọc".
  2. Nếu học viên đọc khớp hoàn toàn, hãy cho điểm từ 8.5 đến 9.5 (Tuyệt đối không cho 10/10).
  3. Nếu có TỪ BỊ LỆCH, THIẾU TỪ, HOẶC TỪ LẠ (do phát âm sai nên hệ thống nghe nhầm), hãy TRỪ ĐIỂM NẶNG TAY (sai 1 từ trừ 1.5 - 2 điểm). Nếu sai quá nhiều, hãy cho dưới 5.0.
  4. Liệt kê rõ những từ phát âm sai vào phần 'corrections' để học viên sửa.
  
  Hãy đánh giá và trả về kết quả ĐÚNG định dạng JSON sau (toàn bộ nhận xét bằng TIẾNG VIỆT):
  {
    "overallScore": number (thang 10.0, ví dụ 7.5),
    "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "grammarScore": number (thang 10),
    "vocabularyScore": number (thang 10),
    "coherenceScore": number (thang 10),
    "feedback": "Nhận xét tổng quan về độ chính xác khi phát âm so với câu gốc",
    "strengths": ["Điểm làm tốt 1", "Điểm làm tốt 2"],
    "improvements": ["Điểm cần khắc phục 1", "Điểm cần khắc phục 2"],
    "corrections": [
      {
        "original": "Từ học viên phát âm sai (hoặc thiếu)",
        "issue": "Giải thích vì sao sai hoặc khác biệt so với câu gốc",
        "suggestion": "Cách đọc đúng của từ đó"
      }
    ],
    "improvedVersion": "Câu gốc hoàn chỉnh (để học viên luyện lại)"
  }\`;
  
      `;
  code = code.substring(0, startIndex) + newPrompt + code.substring(endIndex);
}

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
