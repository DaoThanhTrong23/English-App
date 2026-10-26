const fs = require('fs');
const filePath = 'D:/KLCN_UngDungHocTiengAnh/English_App/web-english/src/config/axios.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = "const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';";
const newCode = `const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (!envUrl || envUrl.trim() === '') {
    return 'http://localhost:3000/api';
  }
  const clean = envUrl.trim().replace(/\\/+$/, '');
  return clean.endsWith('/api') ? clean : \`\${clean}/api\`;
};

const API_BASE_URL = getBaseUrl();`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated axios.ts to automatically format API_BASE_URL with /api');
} else {
  console.log('Already updated or pattern changed');
}
