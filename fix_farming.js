const fs = require('fs');
const file = 'backend-api/src/module/student-test/student-test.service.ts';
let code = fs.readFileSync(file, 'utf8');

const injection = `
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "user_not_found", "Không tìm thấy người dùng");

    // LỖ HỔNG 1: ANTI-FARMING (Ngăn chặn làm lại bài để cày XP/Elo)
    const existingResult = await prisma.userTestResult.findFirst({
      where: { userId, testId }
    });
    const isRetake = Boolean(existingResult);
`;

code = code.replace(/const user = await prisma\.user\.findUnique\(\{ where: \{ id: userId \} \}\);\s*if \(!user\) throw new ApiError\(404, "user_not_found", "Không tìm thấy người dùng"\);/, injection);

const injection2 = `
      // Update User Elo & XP (Chỉ cập nhật nếu KHÔNG PHẢI retake)
      if (!isRetake) {
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
      }
`;

code = code.replace(/\/\/ Update User Elo & XP[\s\S]*?xpPoints: \{ increment: xpGained \}\s*\}\s*\}\);/, injection2);

fs.writeFileSync(file, code);
