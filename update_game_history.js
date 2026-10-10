const fs = require('fs');

const updateRepo = (file, gameCode) => {
  let code = fs.readFileSync(file, 'utf8');
  const injectTarget = 'const updatedUser = await prisma.user.update({';
  
  if (code.includes(injectTarget) && !code.includes('prisma.gameHistory.create')) {
    const injectedCode = `      // 1b. Luu GameHistory
      await prisma.gameHistory.create({
        data: {
          userId: data.userId,
          gameCode: '${gameCode}',
          score: data.score,
          durationSec: data.duration,
          correctPairs: data.correctPairs,
          totalPairs: data.totalPairs
        }
      });\n\n      ` + injectTarget;
      
    code = code.replace(injectTarget, injectedCode);
    fs.writeFileSync(file, code);
    console.log("Updated", file);
  }
};

updateRepo('backend-api/src/module/mario-game/mario-game.repository.ts', 'MARIO');
updateRepo('backend-api/src/module/bubble-game/bubble-game.repository.ts', 'BUBBLE');
updateRepo('backend-api/src/module/memory-card/memory-card.repository.ts', 'MEMORY');
updateRepo('backend-api/src/module/word-matching/word-matching.repository.ts', 'MATCHING');
