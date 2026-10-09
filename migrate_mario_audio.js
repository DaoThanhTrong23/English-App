const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// 1. Remove expo-av import
code = code.replace(/import \{ Audio \} from 'expo-av';\n/g, '');

// 2. Add useAudioPlayer to expo-audio import
code = code.replace(
  /import \{ useAudioRecorder, useAudioRecorderState/g,
  `import { useAudioRecorder, useAudioRecorderState, useAudioPlayer`
);

// 3. Remove the old sound state and playWordAudio function
const soundStateRegex = /const \[sound, setSound\] = useState<Audio\.Sound \| null>\(null\);/;
code = code.replace(soundStateRegex, '');

const playWordAudioRegex = /useEffect\(\(\) => \{\n\s*return sound \? \(\) => \{ sound\.unloadAsync\(\); \} : undefined;\n\s*\}, \[sound\]\);\n\n\s*const playWordAudio = async \(\) => \{[\s\S]*?console\.log\('Error playing sound', error\);\n\s*\}\n\s*\};/;
code = code.replace(playWordAudioRegex, '');

// 4. Define player inside the component
// Find `const isPressed = useRef(false);` and add player below it
code = code.replace(
  /const isPressed = useRef\(false\);/,
  `const isPressed = useRef(false);\n  const player = useAudioPlayer(words[currentIndex]?.audioUrl || '');`
);

// 5. Update the button to use player.play()
code = code.replace(
  /<TouchableOpacity onPress=\{playWordAudio\}/g,
  `<TouchableOpacity onPress={() => player.play()}`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
