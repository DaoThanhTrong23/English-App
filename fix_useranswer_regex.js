const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/student-test/student-test.service.ts', 'utf8');

const regex = /assessmentHistories\.push\(\{[\s\S]*?userId,[\s\S]*?questionId: q\.id,[\s\S]*?isCorrect,[\s\S]*?timeTakenMs: sub\.timeTakenMs \|\| 5000,[\s\S]*?avgEloAfter\s*\}\);/;

const newPush = `assessmentHistories.push({
          userId,
          questionId: q.id,
          isCorrect,
          timeTakenMs: sub.timeTakenMs || 5000,
          avgEloAfter,
          userAnswer: sub.textAnswer || (sub.selectedAnswerId ? sub.selectedAnswerId.toString() : null)
        });`;

if (regex.test(code)) {
    code = code.replace(regex, newPush);
    fs.writeFileSync('backend-api/src/module/student-test/student-test.service.ts', code);
    console.log("Replaced userAnswer successfully!");
} else {
    console.log("Could not find the block to replace userAnswer.");
}
