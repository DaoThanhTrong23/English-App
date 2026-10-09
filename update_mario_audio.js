const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

if (!code.includes("import { Audio } from 'expo-av';")) {
  code = code.replace(
    /import \{ useAudioRecorder/g,
    `import { Audio } from 'expo-av';\nimport { useAudioRecorder`
  );
}

// Add state for sound
if (!code.includes("const [sound, setSound] = useState<Audio.Sound | null>(null);")) {
  code = code.replace(
    /const \[isRecording, setIsRecording\] = useState\(false\);/,
    `const [isRecording, setIsRecording] = useState(false);\n  const [sound, setSound] = useState<Audio.Sound | null>(null);`
  );
}

// Add playSound function
if (!code.includes("const playWordAudio = async () =>")) {
  code = code.replace(
    /useEffect\(\(\) => \{\n\s*fetchGameData\(\);\n\s*startGroundAnimation\(\);\n\s*spawnObstacle\(\);\n\s*return \(\) => \{\n\s*stopAnimations\(\);\n\s*\};\n\s*\}, \[\]\);/,
    `useEffect(() => {
    fetchGameData();
    startGroundAnimation();
    spawnObstacle();
    return () => {
      stopAnimations();
    };
  }, []);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const playWordAudio = async () => {
    const currentWord = words[currentIndex];
    if (!currentWord || !currentWord.audioUrl) return;
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentWord.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };`
  );
}

// Add Speaker button in popup
const popupUI = `<Text style={styles.phoneticText}>/{words[currentIndex].phonetic}/</Text>`;
const newPopupUI = `<Text style={styles.phoneticText}>/{words[currentIndex].phonetic}/</Text>
              
              {words[currentIndex].audioUrl && (
                <TouchableOpacity onPress={playWordAudio} style={{ marginBottom: 10, backgroundColor: '#f3f4f6', padding: 8, borderRadius: 20 }}>
                  <Ionicons name="volume-high" size={24} color="#3b82f6" />
                </TouchableOpacity>
              )}`;

code = code.replace(popupUI, newPopupUI);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
