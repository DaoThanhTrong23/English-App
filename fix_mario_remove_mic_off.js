const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Remove allowsRecording: false
code = code.replace(
  /\/\/ T\u1eaft ch\u1ebf \u0111\u1ed9 thu \u00e2m \u0111\u1ec3 iOS \u1ea9n d\u1ea5u ch\u1ea5m cam \(Mic\)\s*try \{ await setAudioModeAsync\(\{ allowsRecording: false, playsInSilentMode: true \}\); \} catch\(e\) \{\}/,
  ""
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
