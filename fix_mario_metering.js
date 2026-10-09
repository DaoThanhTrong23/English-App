const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Update imports
code = code.replace(
  /import \{ useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync \} from 'expo-audio';/,
  "import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';"
);

// Update hook
code = code.replace(
  /const recorder = useAudioRecorder\(RecordingPresets\.HIGH_QUALITY\);/,
  `const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true
  });
  const recorderState = useAudioRecorderState(recorder, 100);`
);

// Update startRecording
code = code.replace(
  /await setAudioModeAsync\(\{ allowsRecording: true, playsInSilentMode: true \}\);\s*recorder\.record\(\);/,
  `await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      try {
        await recorder.prepareToRecordAsync();
      } catch(e) {}
      recorder.record();`
);

// Add progress bar UI inside popup
code = code.replace(
  /<Text style=\{\{marginTop: 10, color: '#6b7280', fontSize: 12\}\}>Nhấn giữ để phát âm<\/Text>/,
  `<Text style={{marginTop: 10, color: '#6b7280', fontSize: 12}}>
                  {isRecording ? "Đang ghi âm..." : "Nhấn giữ để phát âm"}
                </Text>
                {isRecording && (
                  <View style={{ width: '100%', height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, marginTop: 10, overflow: 'hidden' }}>
                    <Animated.View style={{ 
                      height: '100%', 
                      backgroundColor: '#10b981',
                      width: \`\${Math.max(0, Math.min(100, ((recorderState.metering || -60) + 60) * (100 / 60)))}\%\`
                    }} />
                  </View>
                )}`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
