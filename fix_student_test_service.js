const fs = require('fs');

let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

// 1. Move 'listening' to multiple_choice block
code = code.replace(
  /if \(q\.questionType === 'multiple_choice'\) \{/,
  "if (q.questionType === 'multiple_choice' || q.questionType === 'listening') {"
);

code = code.replace(
  /\} else if \(q\.questionType === 'fill_in_blank' \|\| q\.questionType === 'listening' \|\| q\.questionType === 'writing'\) \{/,
  "} else if (q.questionType === 'fill_in_blank' || q.questionType === 'writing') {"
);

// 2. Add AI check for writing
// The current speaking logic is:
// } else if (q.questionType === 'speaking') {
//   if (sub.textAnswer && sub.textAnswer.includes('[?im AI:')) {
//     const match = sub.textAnswer.match(/\[?im AI:\s*(\d+)%\]/);
//     if (match && parseInt(match[1]) >= 60) {
//       isCorrect = true;
//     }
//   }
// }

// Let's modify writing to also accept [Điểm AI:] if present.
code = code.replace(
  /\} else if \(q\.questionType === 'fill_in_blank' \|\| q\.questionType === 'writing'\) \{[\s\S]*?\} else if \(q\.questionType === 'speaking'\) \{/,
  `} else if (q.questionType === 'fill_in_blank' || q.questionType === 'writing') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\\[Điểm AI:\\s*(\\d+)%\\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          } else if (correctAns) {
            if (sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
              isCorrect = true;
            }
          } else if (sub.textAnswer && sub.textAnswer.trim().length > 0) {
            isCorrect = true;
          }
        } else if (q.questionType === 'speaking') {`
);

// Fallback for encoding
code = code.replace(
  /\} else if \(q\.questionType === 'fill_in_blank' \|\| q\.questionType === 'writing'\) \{[\s\S]*?\} else if \(q\.questionType === 'speaking'\) \{/m,
  `} else if (q.questionType === 'fill_in_blank' || q.questionType === 'writing') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\\[Điểm AI:\\s*(\\d+)%\\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          } else if (correctAns) {
            if (sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
              isCorrect = true;
            }
          } else if (sub.textAnswer && sub.textAnswer.trim().length > 0) {
            isCorrect = true;
          }
        } else if (q.questionType === 'speaking') {`
);

fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
