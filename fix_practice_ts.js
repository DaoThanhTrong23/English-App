const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// Fix audioRecorder and currentQ
code = code.replace(
  /const audioRecorder = useAudioRecorder\(\{[\s\S]*?\}\);/,
  "const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);"
);

if (!code.includes("RecordingPresets")) {
  code = code.replace(
    /useAudioRecorder, useAudioRecorderState, AudioModule, useAudioPlayer/g,
    "useAudioRecorder, useAudioRecorderState, AudioModule, useAudioPlayer, RecordingPresets"
  );
}

code = code.replace(
  /const currentQ = questions\[currentStep\];/,
  "const currentQ = testQuestions[currentIndex];"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
