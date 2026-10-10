const fs = require('fs');

let repoCode = fs.readFileSync('backend-api/src/module/word-matching/word-matching.repository.ts', 'utf8');
repoCode = repoCode.replace(
  /async finalizeGameResult\(userId: number, earnedXp: number\) \{[\s\S]*?const updatedUser = await prisma\.user\.update\(\{/m,
  `async finalizeGameResult(userId: number, earnedXp: number, totalQuestions: number, correctCount: number) {
      await prisma.gameHistory.create({
        data: {
          userId: userId,
          gameCode: 'MATCHING',
          score: earnedXp,
          durationSec: 0, // Word matching doesn't track duration yet
          correctPairs: correctCount,
          totalPairs: totalQuestions
        }
      });
      const updatedUser = await prisma.user.update({`
);
fs.writeFileSync('backend-api/src/module/word-matching/word-matching.repository.ts', repoCode);

let serviceCode = fs.readFileSync('backend-api/src/module/word-matching/word-matching.service.ts', 'utf8');
serviceCode = serviceCode.replace(
  /await this\.repository\.finalizeGameResult\(userId, score\);/,
  'await this.repository.finalizeGameResult(userId, score, totalQuestions, correctCount);'
);
fs.writeFileSync('backend-api/src/module/word-matching/word-matching.service.ts', serviceCode);
