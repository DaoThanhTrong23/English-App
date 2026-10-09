const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Add SecureStore and API_URL
if (!code.includes("expo-secure-store")) {
  code = code.replace(
    /import \{ axiosClient \} from '\.\.\/\.\.\/api\/axiosClient';/,
    "import { axiosClient } from '../../api/axiosClient';\nimport * as SecureStore from 'expo-secure-store';\nimport { API_URL } from '../../constants/api';"
  );
}

// Replace axios with fetch
code = code.replace(
  /const res = await axiosClient\.post\('\/ai\/evaluate-pronunciation', formData, \{[\s\S]*?\}\);[\s\S]*?const pScore = res\.data\?\.data\?\.pronunciationScore \|\| 0;/,
  `const token = await SecureStore.getItemAsync('accessToken');
        const res = await fetch(\`\${API_URL}/ai/evaluate-pronunciation\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`
          },
          body: formData
        });
        
        const responseData = await res.json();
        const pScore = responseData?.data?.pronunciationScore || 0;`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
