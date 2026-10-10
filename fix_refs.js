const fs = require('fs');

let code = fs.readFileSync('web-english/src/features/tests/pages/TestDetail.tsx', 'utf8');

// Replace document.getElementById with useRef
if (code.includes("document.getElementById('audio-upload')")) {
  code = code.replace(
    /const fileInputRef = useRef<HTMLInputElement>\(null\);/,
    "const fileInputRef = useRef<HTMLInputElement>(null);\n  const audioInputRef = useRef<HTMLInputElement>(null);\n  const imageInputRef = useRef<HTMLInputElement>(null);"
  );

  code = code.replace(
    /<input type="file" id="audio-upload" style=\{\{ display: 'none' \}\} accept="audio\/\*"/,
    '<input type="file" ref={audioInputRef} style={{ display: \'none\' }} accept="audio/*"'
  );

  code = code.replace(
    /onClick=\{\(\) => document\.getElementById\('audio-upload'\)\?\.click\(\)\}/,
    'onClick={() => audioInputRef.current?.click()}'
  );

  code = code.replace(
    /<input type="file" id="image-upload" style=\{\{ display: 'none' \}\} accept="image\/\*"/,
    '<input type="file" ref={imageInputRef} style={{ display: \'none\' }} accept="image/*"'
  );

  code = code.replace(
    /onClick=\{\(\) => document\.getElementById\('image-upload'\)\?\.click\(\)\}/,
    'onClick={() => imageInputRef.current?.click()}'
  );
  
  fs.writeFileSync('web-english/src/features/tests/pages/TestDetail.tsx', code);
}
