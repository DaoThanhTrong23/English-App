const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Fix stopRecording logic
code = code.replace(
  /try \{ await recorder\.stop\(\); \} catch\(e\) \{\}/,
  `try { 
      await recorder.stop(); 
    } catch(e) {
      console.log("Stop recording error", e);
      return;
    }`
);

// Fix FormData file extension
code = code.replace(
  /name: 'audio\.wav',/,
  "name: 'audio.m4a',"
);
code = code.replace(
  /type: 'audio\/wav',/,
  "type: 'audio/m4a',"
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
