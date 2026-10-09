const fs = require('fs');
const path = require('path');

const dir = 'backend-api/src/module/mario-game';
const files = fs.readdirSync(dir);

for (const file of files) {
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  code = code.replace(/bubble-game/g, 'mario-game');
  code = code.replace(/bubbleGame/g, 'marioGame');
  code = code.replace(/BubbleGame/g, 'MarioGame');
  code = code.replace(/BUBBLE/g, 'MARIO');
  
  // Specific API logic for Mario Game
  if (file === 'mario-game.service.ts') {
    // Modify startGame to return a simpler structure for Mario
    code = code.replace(
      /return \{\s*totalPairs[\s\S]*?meaningBubbles\s*\};\s*\}/,
      `return {
      totalWords: words.length,
      words: words.map(w => ({
        id: w.id,
        headword: w.headword,
        meaning: w.meaning,
        phonetic: w.phonetic,
        audioUrl: w.audioUrl
      }))
    };
  }`
    );
  }

  if (file === 'mario-game.schema.ts') {
    code = code.replace(/wordId: z\.number\(\),/g, 'wordId: z.number(),');
    code = code.replace(/meaningId: z\.number\(\),/g, ''); // Mario doesn't need meaningId match
  }
  
  fs.writeFileSync(filePath, code);
}
