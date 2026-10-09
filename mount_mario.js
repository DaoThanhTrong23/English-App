const fs = require('fs');
let code = fs.readFileSync('backend-api/src/app.ts', 'utf8');

if (!code.includes('marioGameRouter')) {
  code = code.replace(/import \{ wordMatchingRouter \} from '\.\/module\/word-matching\/word-matching\.route\.js';/, 
    "import { wordMatchingRouter } from './module/word-matching/word-matching.route.js';\nimport { marioGameRouter } from './module/mario-game/mario-game.route.js';");
    
  code = code.replace(/app\.use\("\/api\/game\/word-matching", wordMatchingRouter\);/, 
    "app.use(\"/api/game/word-matching\", wordMatchingRouter);\n  app.use(\"/api/game/mario\", marioGameRouter);");
    
  fs.writeFileSync('backend-api/src/app.ts', code);
}
