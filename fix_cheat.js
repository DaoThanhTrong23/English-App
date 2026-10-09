const fs = require('fs');
const file = 'backend-api/src/module/bubble-game/bubble-game.repository.ts';
let code = fs.readFileSync(file, 'utf8');

// Cap the score before incrementing
code = code.replace(/score: data\.score/g, 'score: Math.max(0, Math.min(data.score, 300))');
// Wait, the return object also has `score: data.score`. 
// I should inject the capping logic at the top of the function.

let original = fs.readFileSync(file, 'utf8');
const injection = `
  async finalizeGameResult(data: {
    userId: number;
    score: number;
    duration: number;
    correctPairs: number;
    totalPairs: number;
    lessonId?: number;
  }) {
    // ANTI-CHEAT: Giới hạn điểm XP tối đa một ván game là 300 XP, tối thiểu là 0.
    const safeScore = Math.max(0, Math.min(data.score, 300));

    // 1. Cộng điểm XP cho User trong MySQL
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        xpPoints: { increment: safeScore }
      }
    });

    // 2. Giải phóng tiến trình tạm trong RAM
    progressStore.delete(data.userId);

    return {
      currentXp: updatedUser.xpPoints,
      score: safeScore,
      duration: data.duration,
      correctPairs: data.correctPairs,
      totalPairs: data.totalPairs
    };
  }
`;

original = original.replace(/async finalizeGameResult\([\s\S]*?return \{[\s\S]*?\}\s*\}/, injection);
fs.writeFileSync(file, original);
