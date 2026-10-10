const fs = require('fs');

let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// 1. Import useAudioPlayer
if (!code.includes('useAudioPlayer')) {
  code = code.replace(
    /import \{ useAudioRecorder, useAudioRecorderState, AudioModule \} from 'expo-audio';/,
    "import { useAudioRecorder, useAudioRecorderState, AudioModule, useAudioPlayer } from 'expo-audio';"
  );
}

if (!code.includes('import { API_URL }')) {
  code = code.replace(
    /import \{ axiosClient \} from '\.\.\/api\/axiosClient';/,
    "import { axiosClient } from '../api/axiosClient';\nimport { API_URL } from '../constants/api';"
  );
}

// 2. Setup the player logic
if (!code.includes('const player = useAudioPlayer')) {
  code = code.replace(
    /const audioRecorder = useAudioRecorder\([^)]+\);/g,
    `const audioRecorder = useAudioRecorder({
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000
  });
  
  const currentQ = questions[currentStep];
  const audioSource = currentQ?.audioUrl ? (currentQ.audioUrl.startsWith('http') ? currentQ.audioUrl : \`\${API_URL}\${currentQ.audioUrl}\`) : '';
  const player = useAudioPlayer(audioSource);`
  );
}

// 3. Update playDummyAudio
code = code.replace(
  /const playDummyAudio = async \(\) => \{\n\s*Alert\.alert\("ThA'ng bAAo", "\?ang phAAt AAm thanh bAAi h\?c\.\.\."\);\n\s*\};/,
  `const playDummyAudio = async () => {
    if (audioSource) {
      player.play();
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file audio!');
    }
  };`
);

// Fallback for character encoding issues just in case
code = code.replace(
  /const playDummyAudio = async \(\) => \{\n\s*Alert\.alert\("Thông báo", "Đang phát âm thanh bài học\.\.\."\);\n\s*\};/,
  `const playDummyAudio = async () => {
    if (audioSource) {
      player.play();
    } else {
      Alert.alert('Thông báo', 'Không tìm thấy file audio!');
    }
  };`
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
