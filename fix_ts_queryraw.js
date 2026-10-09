const fs = require('fs');

const games = [
  { folder: 'bubble-game', file: 'bubble-game' },
  { folder: 'memory-card', file: 'memory-card' },
  { folder: 'word-matching', file: 'word-matching' }
];

for (const game of games) {
  const repoPath = 'backend-api/src/module/' + game.folder + '/' + game.file + '.repository.ts';
  if (fs.existsSync(repoPath)) {
    let repoCode = fs.readFileSync(repoPath, 'utf8');
    repoCode = repoCode.replace(/await prisma\.\$queryRawUnsafe\(/g, 'await prisma.$queryRawUnsafe<any[]>(');
    fs.writeFileSync(repoPath, repoCode);
  }
}
