const fs = require('fs');
const file = 'mobile-english/src/api/axiosClient.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\/auth\/refresh-token/g, '/auth/refresh');

fs.writeFileSync(file, code);
