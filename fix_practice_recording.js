const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// 1. Add requestRecordingPermissionsAsync to the imports
if (!code.includes('requestRecordingPermissionsAsync')) {
  code = code.replace(
    /useAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync/,
    "useAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync"
  );
}

// 2. Fix toggleRecord call
code = code.replace(
  /await AudioModule\.requestRecordingPermissionsAsync\(\);/g,
  "await requestRecordingPermissionsAsync();"
);

// Also remove AudioModule.setAudioModeAsync if it's there
code = code.replace(
  /await AudioModule\.setAudioModeAsync\(\{/g,
  "await setAudioModeAsync({"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
