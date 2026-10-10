const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /import \{ useAudioRecorder, useAudioPlayer, AudioModule \} from 'expo-audio';/,
  "import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
