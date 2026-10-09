const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

code = code.replace(
  /const formData = new FormData\(\);[\s\S]*?const pScore = responseData\?\.data\?\.pronunciationScore \|\| 0;/,
  `// Use expo-file-system for reliable multipart uploads
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await FileSystem.uploadAsync(\`\${API_URL}/ai/evaluate-pronunciation\`, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'audio',
        mimeType: 'audio/m4a',
        parameters: {
          targetWord: currentWord.headword,
          targetIpa: currentWord.phonetic || ''
        },
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      
      const responseData = JSON.parse(response.body);
      const pScore = responseData?.data?.pronunciationScore || 0;`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
