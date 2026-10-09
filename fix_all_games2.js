const fs = require('fs');
const games = [
  'bubble-game/bubble-game.repository.ts',
  'memory-card/memory-card.repository.ts',
  'word-matching/word-matching.repository.ts'
];

for (const game of games) {
  const file = 'backend-api/src/module/' + game;
  if (!fs.existsSync(file)) continue;
  
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('increment: data.score')) {
    // Chỉ thay thế dòng increment một lần
    code = code.replace(/increment: data\.score/, 'increment: Math.max(0, Math.min(data.score, 300))');
    
    // Tìm finalizeGameResult và gán lại data.score
    code = code.replace(/async finalizeGameResult\(data: \{[^}]+\}\) \{/, (match) => {
      return match + "\n    data.score = Math.max(0, Math.min(data.score, 300));";
    });
    
    fs.writeFileSync(file, code);
  }
}
