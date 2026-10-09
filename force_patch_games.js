const fs = require('fs');

const games = [
  { folder: 'bubble-game', file: 'bubble-game', code: 'BUBBLE' },
  { folder: 'memory-card', file: 'memory-card', code: 'MEMORY' },
  { folder: 'word-matching', file: 'word-matching', code: 'MATCHING' }
];

for (const game of games) {
  const repoPath = 'backend-api/src/module/' + game.folder + '/' + game.file + '.repository.ts';
  
  if (fs.existsSync(repoPath)) {
    let repoCode = fs.readFileSync(repoPath, 'utf8');
    
    const newGetWords = `
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    let limit = fallbackLimit;
    const gameSetting = await prisma.gameSetting.findFirst({
      where: { game: { code: '` + game.code + `' }, difficulty: 'NORMAL' }
    });
    if (gameSetting) {
      limit = gameSetting.itemCount;
    }

    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true },
      });
      return lessonWords.map((lw) => lw.word);
    }

    const userWords = await prisma.userProgress.findMany({
      where: { userId },
      take: limit,
      include: { word: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (userWords.length > 0) {
      let words = userWords.map(uw => uw.word);
      if (words.length < limit) {
        const moreWords = await prisma.word.findMany({
          where: { id: { notIn: words.map(w => w.id) } },
          take: limit - words.length
        });
        words = [...words, ...moreWords];
      }
      return words.sort(() => 0.5 - Math.random());
    }

    const randomWords = await prisma.word.findMany({
      take: limit,
    });
    return randomWords.sort(() => 0.5 - Math.random());
  }
`;

    repoCode = repoCode.replace(/async getWordsForGame\([^)]+\) \{[\s\S]*?\}\s*\n\s*\/\/ 2\./, newGetWords.trim() + "\n\n  // 2.");
    fs.writeFileSync(repoPath, repoCode);
  }
}
