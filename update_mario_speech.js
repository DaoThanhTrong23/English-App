const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// 1. Import Speech
if (!code.includes("import * as Speech from 'expo-speech';")) {
  code = code.replace(
    /import \{ useAudioRecorder/g,
    `import * as Speech from 'expo-speech';\nimport { useAudioRecorder`
  );
}

// 2. Add handlePlay function
const isPressedRegex = /const isPressed = useRef\(false\);\n\s*const player = useAudioPlayer\(words\[currentIndex\]\?\.audioUrl \|\| ''\);/;
if (code.match(isPressedRegex)) {
  code = code.replace(isPressedRegex, `const isPressed = useRef(false);
  const player = useAudioPlayer(words[currentIndex]?.audioUrl || '');

  const handlePlayAudio = () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;
    
    if (currentWord.audioUrl) {
      player.play();
    } else {
      Speech.speak(currentWord.headword, { language: 'en-US' });
    }
  };`);
}

// 3. Always show the button and use handlePlayAudio
const oldPopupUI = /\{words\[currentIndex\]\.audioUrl && \([\s\S]*?<\/TouchableOpacity>\s*\)\}/;
const newPopupUI = `<TouchableOpacity onPress={handlePlayAudio} style={{ marginBottom: 10, backgroundColor: '#f3f4f6', padding: 8, borderRadius: 20 }}>
                  <Ionicons name="volume-high" size={24} color="#3b82f6" />
                </TouchableOpacity>`;
                
code = code.replace(oldPopupUI, newPopupUI);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
