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
    
    // Replace SELECT * FROM word with SELECT * FROM words
    repoCode = repoCode.replace(/SELECT \* FROM word WHERE id NOT IN/g, 'SELECT * FROM words WHERE id NOT IN');
    repoCode = repoCode.replace(/SELECT \* FROM word ORDER BY RAND/g, 'SELECT * FROM words ORDER BY RAND');
    
    fs.writeFileSync(repoPath, repoCode);
  }
}
