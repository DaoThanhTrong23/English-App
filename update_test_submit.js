const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

// Replace isCorrect evaluation
const oldEval = `        let isCorrect = false;
        if (q.questionType === 'multiple_choice') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns && correctAns.id === sub.selectedAnswerId) {
            isCorrect = true;
          }
        } else if (q.questionType === 'fill_in_blank') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns && sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
            isCorrect = true;
          }
        }`;

const newEval = `        let isCorrect = false;
        if (q.questionType === 'multiple_choice') {
          const correctAns = q.answers.find(a => a.isCorrect);
          if (correctAns && correctAns.id === sub.selectedAnswerId) {
            isCorrect = true;
          }
        } else if (q.questionType === 'fill_in_blank' || q.questionType === 'listening' || q.questionType === 'writing') {
          const correctAns = q.answers.find(a => a.isCorrect);
          // If there is a predefined correct answer, we check strictly. Otherwise, for writing, we just accept it if they wrote something.
          if (correctAns) {
            if (sub.textAnswer && correctAns.answerText.toLowerCase() === sub.textAnswer.toLowerCase().trim()) {
              isCorrect = true;
            }
          } else if (sub.textAnswer && sub.textAnswer.trim().length > 0) {
            isCorrect = true; // Auto-pass essay/writing if no exact answer provided
          }
        } else if (q.questionType === 'speaking') {
          // mobile sends: [Điểm AI: 85%]
          if (sub.textAnswer && sub.textAnswer.includes('[Điểm AI:')) {
            const match = sub.textAnswer.match(/\\[Điểm AI:\\s*(\\d+)%\\]/);
            if (match && parseInt(match[1]) >= 60) {
              isCorrect = true;
            }
          }
        }`;

code = code.replace(oldEval, newEval);

// Replace assessmentHistories.push
const oldPush = `      assessmentHistories.push({
          userId,
          questionId: q.id,
          isCorrect,
          timeTakenMs: sub.timeTakenMs,
          avgEloAfter
        });`;

const newPush = `      assessmentHistories.push({
          userId,
          questionId: q.id,
          isCorrect,
          timeTakenMs: sub.timeTakenMs,
          avgEloAfter,
          userAnswer: sub.textAnswer || (sub.selectedAnswerId ? sub.selectedAnswerId.toString() : null)
        });`;

code = code.replace(oldPush, newPush);

fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
