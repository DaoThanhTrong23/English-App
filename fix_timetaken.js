const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// Inside handleNext, add timeTakenMs
const oldSub = `    const sub = {
      questionId: currentItem.id,
      selectedAnswerId: selectedOptionId,
      textAnswer: finalAnswer
    };`;
    
const newSub = `    const sub = {
      questionId: currentItem.id,
      selectedAnswerId: selectedOptionId,
      textAnswer: finalAnswer,
      timeTakenMs: 5000 // default dummy time to prevent Prisma undefined error
    };`;

code = code.replace(oldSub, newSub);
fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
