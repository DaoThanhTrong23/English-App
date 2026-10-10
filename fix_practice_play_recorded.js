const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

if (!code.includes('const recordedPlayer = useAudioPlayer(recordedUri);')) {
  code = code.replace(
    /const player = useAudioPlayer\(audioSource\);/,
    "const player = useAudioPlayer(audioSource);\n  const recordedPlayer = useAudioPlayer(recordedUri);"
  );
}

code = code.replace(
  /const playRecordedAudio = async \(\) => \{[\s\S]*?\};\s*const getTitle = \(\) => \{/m,
  `const playRecordedAudio = async () => {
      if (!recordedUri || !recordedPlayer) return;
      try {
        recordedPlayer.play();
      } catch(e) {
        Alert.alert("Lỗi", "Không thể phát lại audio vừa ghi.");
      }
    };

    const getTitle = () => {`
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
