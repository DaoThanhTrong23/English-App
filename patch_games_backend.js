const fs = require('fs');

const games = [
  { folder: 'bubble-game', file: 'bubble-game', code: 'BUBBLE' },
  { folder: 'memory-card', file: 'memory-card', code: 'MEMORY' },
  { folder: 'word-matching', file: 'word-matching', code: 'MATCHING' }
];

for (const game of games) {
  const repoPath = \`backend-api/src/module/\${game.folder}/\${game.file}.repository.ts\`;
  const svcPath = \`backend-api/src/module/\${game.folder}/\${game.file}.service.ts\`;
  
  if (fs.existsSync(repoPath)) {
    let repoCode = fs.readFileSync(repoPath, 'utf8');
    
    const newGetWords = \`
  async getWordsForGame(userId: number, fallbackLimit: number = 6, lessonId?: number) {
    // 1. Lấy số lượng câu hỏi từ cấu hình Game (Admin thiết lập)
    let limit = fallbackLimit;
    const gameSetting = await prisma.gameSetting.findFirst({
      where: { game: { code: '\${game.code}' }, difficulty: 'NORMAL' }
    });
    if (gameSetting) {
      limit = gameSetting.itemCount;
    }

    // 2. Nếu có truyền lessonId cụ thể, lấy từ lesson đó
    if (lessonId) {
      const lessonWords = await prisma.lessonWord.findMany({
        where: { lessonId },
        take: limit,
        include: { word: true },
      });
      return lessonWords.map((lw) => lw.word);
    }

    // 3. Ưu tiên lấy từ danh sách chủ đề học tập (từ vựng) của user
    const userWords = await prisma.userProgress.findMany({
      where: { userId },
      take: limit,
      include: { word: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (userWords.length > 0) {
      // Nếu user có học từ, trộn và lấy đủ số lượng
      let words = userWords.map(uw => uw.word);
      if (words.length < limit) {
        // Nếu không đủ, lấy thêm từ ngẫu nhiên bù vào
        const moreWords = await prisma.word.findMany({
          where: { id: { notIn: words.map(w => w.id) } },
          take: limit - words.length
        });
        words = [...words, ...moreWords];
      }
      return words;
    }

    // 4. Nếu user chưa học gì, lấy ngẫu nhiên (hoặc bài đầu tiên)
    return prisma.word.findMany({
      take: limit,
      orderBy: { id: "asc" },
    });
  }
\`;

    repoCode = repoCode.replace(/async getWordsForGame\([\s\S]*?\}\s*\n\s*\/\/ 2\./, newGetWords.trim() + "\n\n  // 2.");
    fs.writeFileSync(repoPath, repoCode);
  }

  if (fs.existsSync(svcPath)) {
    let svcCode = fs.readFileSync(svcPath, 'utf8');
    // Change getWordsForGame call to pass userId
    svcCode = svcCode.replace(/this\.repository\.getWordsForGame\(.*?\);/, 'this.repository.getWordsForGame(userId, query.limit || 6, query.lessonId);');
    fs.writeFileSync(svcPath, svcCode);
  }
}
