const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/practice.tsx', 'utf8');

const newSpeakingLogic = `
      // Auto-evaluate speaking tests using AI
      if (currentItem?.questionType === 'speaking' && recordedUri) {
        setSubmitting(true);
        try {
          const token = await SecureStore.getItemAsync('accessToken');
          
          let targetSentence = currentItem.quesionText;
          const quoteMatch = currentItem.quesionText.match(/["'](.*?)["']/);
          if (quoteMatch && quoteMatch[1]) {
            targetSentence = quoteMatch[1];
          }

          const res = await FileSystem.uploadAsync(\`\${API_URL}/ai/grade-speaking\`, recordedUri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'audio',
            mimeType: 'audio/m4a',
            headers: { Authorization: \`Bearer \${token}\` },
            parameters: { topic: currentItem.quesionText, targetSentence: targetSentence }
          });
          
          const data = JSON.parse(res.body);
          if (data.success) {
            const score = Math.round((data.data.overallScore || 0) * 10);
            finalAnswer = \`[Điểm AI: \${score}%] (Nói: \${data.data.transcript})\`;
          } else {
            finalAnswer = \`[AI Lỗi: \${data.message}]\`;
          }
        } catch (err: any) {
          finalAnswer = \`[AI Error]\`;
        }
        setSubmitting(false);
      }
`;

code = code.replace(
  /\/\/ Auto-evaluate speaking tests using AI[\s\S]*?setSubmitting\(false\);\n\s*\}/,
  newSpeakingLogic.trim()
);

fs.writeFileSync('mobile-english/src/app/practice.tsx', code);
