const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

// First, make sure FileSystem is imported
if (!code.includes("import * as FileSystem from 'expo-file-system/legacy';")) {
  code = code.replace(
    /import \{ useAudioRecorder, useAudioPlayer, AudioModule \} from 'expo-audio';/,
    `import { useAudioRecorder, useAudioPlayer, AudioModule } from 'expo-audio';\nimport * as FileSystem from 'expo-file-system/legacy';\nimport { API_URL } from '../constants/api';\nimport * as SecureStore from 'expo-secure-store';`
  );
}

const newHandleNext = `  const handleNext = async () => {
    let finalAnswer = textAnswer;
    
    // Auto-evaluate speaking tests using AI
    if (currentItem?.questionType === 'speaking' && recordedUri) {
      setSubmitting(true);
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await FileSystem.uploadAsync(\`\${API_URL}/ai/evaluate-pronunciation\`, recordedUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'audio',
          mimeType: 'audio/m4a',
          headers: { Authorization: \`Bearer \${token}\` },
          parameters: { targetWord: currentItem.quesionText, targetIpa: '' }
        });
        const data = JSON.parse(res.body);
        if (data.success) {
          finalAnswer = \`[Điểm AI: \${data.data.overallScore}%]\`;
        } else {
          finalAnswer = \`[AI Lỗi: \${data.message}]\`;
        }
      } catch (err: any) {
        finalAnswer = \`[AI Error]\`;
      }
      setSubmitting(false);
    }

    const sub = {
      questionId: currentItem.id,
      selectedAnswerId: selectedOptionId,
      textAnswer: finalAnswer
    };
    const newSubmissions = [...submissions, sub];
    
    if (currentIndex < totalItems - 1) {
      setSubmissions(newSubmissions);
      setCurrentIndex(currentIndex + 1);
      // Reset state for next question
      setSelectedOptionId(null);
      setTextAnswer('');
      setRecordedUri(null);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } else {
      submitTestResult(newSubmissions);
    }
  };`;

// Replace the old handleNext
code = code.replace(
  /const handleNext = async \(\) => \{[\s\S]*?\} else \{\s*submitTestResult\(newSubmissions\);\s*\}\s*\};/,
  newHandleNext
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
