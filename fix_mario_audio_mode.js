const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /await setAudioModeAsync\(\{ allowsRecordingIOS: true, playsInSilentModeIOS: true \}\);/,
  "await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });"
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
