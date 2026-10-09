const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Add setAudioModeAsync({ allowsRecording: false }) to stopRecording
code = code.replace(
  /const uri = recorder\.uri;/,
  `const uri = recorder.uri;
      // Tắt chế độ thu âm để iOS ẩn dấu chấm cam (Mic)
      try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch(e) {}`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
