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
    code = code.replace(/increment: data\.score/g, 'increment: Math.max(0, Math.min(data.score, 300))');
    
    // Also patch the return value so the client sees the capped score
    // Since return contains `score: data.score`, replace it too
    // Note: It's safer to just change the top of finalizeGameResult to override data.score
    
    code = code.replace(/async finalizeGameResult\(data: \{[\s\S]*?\}\) \{/, 
      "$& // ANTI-CHEAT\n    data.score = Math.max(0, Math.min(data.score, 300));\n"
    );
    
    fs.writeFileSync(file, code);
  }
}
