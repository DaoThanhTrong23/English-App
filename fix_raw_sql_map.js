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
    
    // Add mapping for raw SQL
    repoCode = repoCode.replace(
      /words = \[\.\.\.words, \.\.\.randomWords\];/g,
      "words = [...words, ...randomWords.map(w => ({ ...w, imageUrl: w.image_url, audioUrl: w.audio_url, partOfSpeech: w.part_of_speech, headword: w.headword, meaning: w.meaning }))];"
    );
    
    fs.writeFileSync(repoPath, repoCode);
  }
}
