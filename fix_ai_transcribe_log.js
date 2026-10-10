const fs = require('fs');
let code = fs.readFileSync('backend-api/src/module/AI/ai.service.ts', 'utf8');

code = code.replace(
  /\} catch\(e\) \{\n\s*return audioBuffer;\n\s*\}/,
  "} catch(e) {\n    console.error('FFMPEG ERROR IN convertAnyAudioToWavBuffer:', e);\n    return audioBuffer;\n  }"
);

fs.writeFileSync('backend-api/src/module/AI/ai.service.ts', code);
