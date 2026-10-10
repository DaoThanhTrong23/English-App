const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// Add isRecording state
if (!code.includes('const [isRecording, setIsRecording] = useState(false);')) {
  code = code.replace(
    /const \[recordedUri, setRecordedUri\] = useState<string \| null>\(null\);/,
    "const [recordedUri, setRecordedUri] = useState<string | null>(null);\n  const [isRecording, setIsRecording] = useState(false);"
  );
}

// Reset isRecording on next question
code = code.replace(
  /setRecordedUri\(null\);/g,
  "setRecordedUri(null);\n        setIsRecording(false);"
);

// Update toggleRecord
const newToggleRecord = `
    const toggleRecord = async () => {
      if (isRecording) {
        setIsRecording(false);
        try { await audioRecorder.stop(); } catch(e) {}
        await new Promise(r => setTimeout(r, 300));
        setRecordedUri(audioRecorder.uri);
      } else {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Lỗi", "Cần cấp quyền Microphone để ghi âm.");
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        try {
          await audioRecorder.prepareToRecordAsync();
          audioRecorder.record();
          setIsRecording(true);
        } catch(e: any) {
          Alert.alert("Lỗi Ghi Âm", String(e));
        }
      }
    };
`;
code = code.replace(
  /const toggleRecord = async \(\) => \{[\s\S]*?\}\s*\};\s*const playRecordedAudio = async \(\) => \{/m,
  newToggleRecord + "\n\n    const playRecordedAudio = async () => {"
);

// Replace UI audioRecorder.isRecording with isRecording state
code = code.replace(
  /audioRecorder\.isRecording/g,
  "isRecording"
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
