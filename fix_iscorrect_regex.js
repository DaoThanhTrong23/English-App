const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

// The block to replace:
//        let isCorrect = false;
//        if (q.questionType === 'multiple_choice') {
//          const correctAns = q.answers.find(a => a.isCorrect);
//          if (correctAns && correctAns.id === sub.selectedAnswerId) {
//            isCorrect = true;
//          }
//        } else if (q.questionType === 'fill_in_blank') {
//          const correctAns = q.answers.find(a => a.isCorrect);
//          if (correctAns && sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
//            isCorrect = true;
//          }
//        }

const regex = /let isCorrect = false;[\s\S]*?\} else if \(q\.questionType === 'fill_in_blank'\) \{[\s\S]*?\}\s*\}/;

const newEval = `let isCorrect = false;
        if (q.questionType === 'multiple_choice') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns && correctAns.id === sub.selectedAnswerId) {
            isCorrect = true;
          }
        } else if (q.questionType === 'fill_in_blank' || q.questionType === 'listening' || q.questionType === 'writing') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns) {
            if (sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
              isCorrect = true;
            }
          } else if (sub.textAnswer && sub.textAnswer.trim().length > 0) {
            isCorrect = true;
          }
        } else if (q.questionType === 'speaking') {
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\\[Điểm AI:\\s*(\\d+)%\\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          }
        }`;

if (regex.test(code)) {
    code = code.replace(regex, newEval);
    fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the block to replace.");
}
