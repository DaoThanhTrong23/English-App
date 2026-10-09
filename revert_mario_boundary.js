const fs = require('fs');
let code = fs.readFileSync('mobile-english/src/app/game/mario.tsx', 'utf8');

// Revert Axios call back to the working version
code = code.replace(
  /const res = await axiosClient\.post\('\/ai\/evaluate-pronunciation', formData, \{\s*headers: \{\s*'Content-Type': 'multipart\/form-data',\s*Accept: 'application\/json'\s*\},\s*transformRequest: \(data, headers\) => \{\s*\/\/ Let axios auto-set the boundary for multipart\/form-data\s*delete headers\['Content-Type'\];\s*return data;\s*\}\s*\}\);/,
  `const res = await axiosClient.post('/ai/evaluate-pronunciation', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });`
);

fs.writeFileSync('mobile-english/src/app/game/mario.tsx', code);
