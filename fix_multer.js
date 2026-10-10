const fs = require('fs');

let code = fs.readFileSync('backend-api/src/module/test/test.route.ts', 'utf8');

if (!code.includes('import path from "path";')) {
  code = code.replace(
    /import multer from "multer";/,
    "import multer from \"multer\";\nimport path from \"path\";"
  );
}

const diskStorageCode = `const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });`;

code = code.replace(
  /const upload = multer\(\{ dest: 'uploads\/' \}\);/,
  diskStorageCode
);

fs.writeFileSync('backend-api/src/module/test/test.route.ts', code);
