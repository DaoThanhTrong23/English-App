const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Add setAudioModeAsync to import
code = code.replace(
  /import \{ useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync \} from 'expo-audio';/,
  "import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';"
);

// Update startRecording
code = code.replace(
  /recorder\.record\(\);/,
  `await setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      recorder.record();`
);

// Update stopRecording error handling
code = code.replace(
  /await recorder\.stop\(\);/,
  `try { await recorder.stop(); } catch(e) {}`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
