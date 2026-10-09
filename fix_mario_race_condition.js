const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Add isPressed ref
code = code.replace(
  /const recorderState = useAudioRecorderState\(recorder, 100\);/,
  `const recorderState = useAudioRecorderState(recorder, 100);
  const isPressed = useRef(false);`
);

// Update startRecording
code = code.replace(
  /const startRecording = async \(\) => \{[\s\S]*?setIsRecording\(true\);\s*\} catch \(err\) \{[\s\S]*?\}\s*\};/,
  `const startRecording = async () => {
    isPressed.current = true;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      try { await recorder.prepareToRecordAsync(); } catch(e) {}
      
      // If user released the button while we were preparing, don't start recording!
      if (!isPressed.current) return;
      
      recorder.record();
      setIsRecording(true);
    } catch (err) {}
  };`
);

// Update stopRecording
code = code.replace(
  /const stopRecording = async \(\) => \{[\s\S]*?setIsRecording\(false\);/,
  `const stopRecording = async () => {
    isPressed.current = false;
    setIsRecording(false);`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
