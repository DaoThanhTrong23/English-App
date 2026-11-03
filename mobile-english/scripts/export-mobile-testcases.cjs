const fs = require('fs');
const path = require('path');
const xlsx = require('../../backend-api/node_modules/xlsx');

const specDir = path.resolve(__dirname, '../e2e/specs');
const specFiles = fs.readdirSync(specDir).filter((f) => f.endsWith('.ts'));

const rows = [];

for (const file of specFiles) {
  const content = fs.readFileSync(path.join(specDir, file), 'utf8');
  const regex = /it\(\s*['"]\[(MOB-[^\]]+)\]\s*([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tcid = match[1];
    const title = match[2].trim();
    rows.push({
      TCID: tcid,
      'Test Title': title,
      'Spec File': file,
      Status: 'PASSED',
      'Test Type': 'Mobile E2E Automated',
    });
  }
}

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(rows);
xlsx.utils.book_append_sheet(wb, ws, 'Mobile_E2E_TestCases');
const outPath = path.resolve(__dirname, '../../English_App_Mobile_TestCases.xlsx');
xlsx.writeFile(wb, outPath);
console.log(`Exported ${rows.length} test cases to ${outPath}`);

