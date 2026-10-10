const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/bubble-game.tsx', 'utf8');

code = code.replace(
  /axiosClient\.post\('\/game\/bubble-game\/match',\s*\{\s*wordId:\s*currentSelectedWord\.id,\s*meaningId:\s*currentSelectedMeaning\.id,\s*isCorrect,\s*timeTakenMs\s*\}\)/,
  `axiosClient.post('/game/bubble-game/match', {
        currentScore: score,
        matchedPairs: isCorrect ? matchedIds.length + 1 : matchedIds.length,
        totalPairs: allWords.length || 1
      })`
);

fs.writeFileSync('mobile-english/src/app/game/bubble-game.tsx', code);
