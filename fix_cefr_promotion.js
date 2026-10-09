const fs = require('fs');
const file = 'backend-api/src/module/student-test/student-test.service.ts';
let code = fs.readFileSync(file, 'utf8');

const updateLogic = `
      // Update User Elo & XP
      const avgElo = Math.round((newGrammarElo + newVocabElo + newReadingElo) / 3);
      let newCefr = user.cefrLevel;
      if (avgElo < 1100) newCefr = 'A1';
      else if (avgElo < 1300) newCefr = 'A2';
      else if (avgElo < 1500) newCefr = 'B1';
      else if (avgElo < 1700) newCefr = 'B2';
      else if (avgElo < 1900) newCefr = 'C1';
      else newCefr = 'C2';

      await tx.user.update({
        where: { id: userId },
        data: {
          grammarElo: newGrammarElo,
          vocabElo: newVocabElo,
          readingElo: newReadingElo,
          cefrLevel: newCefr,
          xpPoints: { increment: xpGained }
        }
      });
`;

code = code.replace(/await tx\.user\.update\(\{\s*where: \{ id: userId \},\s*data: \{\s*grammarElo: newGrammarElo,\s*vocabElo: newVocabElo,\s*readingElo: newReadingElo,\s*xpPoints: \{ increment: xpGained \}\s*\}\s*\}\);/m, updateLogic);

fs.writeFileSync(file, code);
