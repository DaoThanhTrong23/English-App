const fs = require('fs');
let code = fs.readFileSync('backend-api/src/app.ts', 'utf8');

code = code.replace(/import wordMatchingRouter from "\.\/module\/word-matching\/word-matching\.route\.js";/, 
  'import wordMatchingRouter from "./module/word-matching/word-matching.route.js";\nimport marioGameRouter from "./module/mario-game/mario-game.route.js";');
  
fs.writeFileSync('backend-api/src/app.ts', code);
