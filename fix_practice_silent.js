const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

if (!code.includes('setAudioModeAsync')) {
  code = code.replace(
    /useAudioPlayer, AudioModule, RecordingPresets/g,
    "useAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync"
  );

  code = code.replace(
    /useEffect\(\(\) => \{[\s\n]*const fetchData = async \(\) => \{/,
    "useEffect(() => {\n    const initAudio = async () => {\n      try {\n        await setAudioModeAsync({ playsInSilentMode: true });\n      } catch (e) {}\n    };\n    initAudio();\n\n    const fetchData = async () => {"
  );
}

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
