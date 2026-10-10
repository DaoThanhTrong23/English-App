const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

code = code.replace(
  /console\.log\("Playing audioSource:", audioSource\);\n\s*console\.log\("Player status:", player\.status\);/g,
  `// console.log removed
    if (audioSource) {
      if (!player) {
        Alert.alert('Lỗi', 'Player chưa sẵn sàng');
        return;
      }
      player.play();
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file audio!');
    }`
);

// Actually, I want to see if replacing the source helps.
// expo-audio useAudioPlayer: if the URL changes, sometimes we need to do player.replace({ uri: audioSource })
code = code.replace(
  /player\.play\(\);/g,
  `try {
        player.replace(audioSource);
        player.play();
      } catch(e: any) {
        Alert.alert('Lỗi phát âm thanh', e.message || 'Không thể phát file này: ' + audioSource);
      }`
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
