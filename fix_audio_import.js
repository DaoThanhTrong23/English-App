const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(/import \{ Audio \} from 'expo-audio';/, "import { Audio } from 'expo-av';");

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
