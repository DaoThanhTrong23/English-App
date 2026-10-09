const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Remove manual Content-Type for FormData in Axios
code = code.replace(
  /const res = await axiosClient\.post\('\/ai\/evaluate-pronunciation', formData, \{\s*headers: \{ 'Content-Type': 'multipart\/form-data' \}\s*\}\);/,
  `const res = await axiosClient.post('/ai/evaluate-pronunciation', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json'
          },
          transformRequest: (data, headers) => {
            // Let axios auto-set the boundary for multipart/form-data
            delete headers['Content-Type'];
            return data;
          }
        });`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
