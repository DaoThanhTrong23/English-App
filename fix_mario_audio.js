const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Replace import
code = code.replace(
  /import \{ Audio \} from 'expo-av';/,
  "import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';"
);

// Add hook
code = code.replace(
  /const recorderRef = useRef<any>\(null\);/,
  `const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);`
);

// Update startRecording
code = code.replace(
  /const startRecording = async \(\) => \{[\s\S]*?setIsRecording\(true\);\s*\} catch \(err\) \{[\s\S]*?\}\s*\};/,
  `const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Cấp quyền', 'Bạn cần cho phép sử dụng Micro');
        return;
      }
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('Record err', err);
    }
  };`
);

// Update stopRecording
code = code.replace(
  /const stopRecording = async \(\) => \{[\s\S]*?setIsRecording\(false\);\s*if \(\!recorderRef\.current\) return;\s*try \{[\s\S]*?await recorderRef\.current\.stopAndUnloadAsync\(\);\s*const uri = recorderRef\.current\.getURI\(\);/,
  `const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
