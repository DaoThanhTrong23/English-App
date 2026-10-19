import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const modulesDir = path.resolve('src/module');
const modules = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory()).sort();

const workbook = xlsx.utils.book_new();
const allSheetsData = {};

function parseTestFile(filePath, isIntegration, modName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const testCases = [];

  let currentDescribe = '';
  let insideIt = false;
  let currentItTitle = '';
  let itBodyLines = [];
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const descMatch = line.match(/describe\(\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) {
      currentDescribe = descMatch[1];
    }

    const itMatch = line.match(/it\(\s*['"`]([^'"`]+)['"`]/);
    if (itMatch && !insideIt) {
      insideIt = true;
      currentItTitle = itMatch[1];
      itBodyLines = [];
      braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      continue;
    }

    if (insideIt) {
      itBodyLines.push(line);
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceDepth <= 0 && line.includes(');')) {
        testCases.push(analyzeItBlock(currentItTitle, currentDescribe, itBodyLines, isIntegration, modName));
        insideIt = false;
        currentItTitle = '';
        itBodyLines = [];
      }
    }
  }

  if (insideIt && currentItTitle) {
    testCases.push(analyzeItBlock(currentItTitle, currentDescribe, itBodyLines, isIntegration, modName));
  }

  return testCases;
}

function analyzeItBlock(title, describeText, bodyLines, isIntegration, modName) {
  let tcid = '';
  let cleanTitle = title;
  const tcidMatch = title.match(/\[([a-zA-Z0-9_-]+)\]/);
  if (tcidMatch) {
    tcid = tcidMatch[1];
    cleanTitle = title.replace(/\[[a-zA-Z0-9_-]+\]\s*/, '').trim();
  } else {
    tcid = `${modName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${isIntegration ? 'IT' : 'UT'}`;
  }

  const fullBody = bodyLines.join('\n');

  // Summary categorization
  let category = 'Kiểm thử chức năng chuẩn (Happy Path)';
  if (/auth|phân quyền|xác thực|401|403|forbidden|unauthorized/i.test(describeText) || /phân quyền|quyền|403|401|chặn|unauthorized|forbidden/i.test(cleanTitle)) {
    category = 'Kiểm thử phân quyền & Bảo mật (Authorization & Security 401/403)';
  } else if (/concurrency|race|song song|đồng thời|spam|double|đụng độ/i.test(describeText) || /song song|đồng thời|cùng lúc|spam|double|đụng độ/i.test(cleanTitle)) {
    category = 'Kiểm thử đụng độ đồng thời (Concurrency / Race Condition - Update vs Delete)';
  } else if (/conflict|xung đột|trùng|rollback/i.test(describeText) || /trùng|xung đột|rollback/i.test(cleanTitle)) {
    category = 'Kiểm thử toàn vẹn dữ liệu & Xung đột (Data Conflict / Rollback)';
  } else if (/bad|negative|lỗi|sai|không hợp lệ|không tồn tại|400|404|422/i.test(describeText) || /lỗi|thiếu|sai|ném|không tồn tại/i.test(cleanTitle)) {
    category = 'Kiểm thử trường hợp biên & Ngoại lệ (Negative / Bad Case)';
  } else if (/network|mất kết nối|hạ tầng|500|p1001|econnrefused/i.test(describeText) || /mất kết nối|đứt|timeout|500/i.test(cleanTitle)) {
    category = 'Kiểm thử mất kết nối mạng & Lỗi hệ thống (Network & System Error)';
  }

  // Steps & Data
  let step = '';
  let data = '';
  let resultExpect = '';

  if (isIntegration) {
    let method = 'GET';
    let endpoint = '/api/...';
    const reqMatch = fullBody.match(/request\(app\)\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]\)/i);
    if (reqMatch) {
      method = reqMatch[1].toUpperCase();
      endpoint = reqMatch[2];
    } else {
      const titleReqMatch = cleanTitle.match(/(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)/i);
      if (titleReqMatch) {
        method = titleReqMatch[1].toUpperCase();
        endpoint = titleReqMatch[2];
      }
    }

    step = `1. Thiết lập phiên đăng nhập / Mock quyền truy cập tương ứng.\n2. Gửi request HTTP ${method} tới endpoint ${endpoint}.\n3. Xác thực mã trạng thái HTTP và cấu trúc JSON trả về.`;

    const sendMatch = fullBody.match(/\.send\(([\s\S]*?)\)/);
    if (sendMatch) {
      data = sendMatch[1].trim().replace(/\s+/g, ' ');
      if (data.length > 200) data = data.substring(0, 197) + '...';
    } else if (endpoint.includes('?')) {
      data = `Query parameters: ${endpoint.split('?')[1]}`;
    } else {
      data = `Path param hoặc Payload chuẩn của ${modName}`;
    }

    const statusMatch = fullBody.match(/expect\(res\.status\)\.toBe\((\d+)\)/);
    const expectedStatus = statusMatch ? statusMatch[1] : (category.includes('Negative') ? '400 / 422' : '200');

    resultExpect = `HTTP Status: ${expectedStatus}. `;
    if (expectedStatus === '200' || expectedStatus === '201') {
      resultExpect += 'Response trả về success = true cùng dữ liệu hợp lệ.';
    } else if (expectedStatus === '422' || expectedStatus === '400') {
      resultExpect += 'Báo lỗi validation hoặc bad request rõ ràng, không làm crash server.';
    } else if (expectedStatus === '403') {
      resultExpect += 'Báo lỗi forbidden do tài khoản không có quyền truy cập thông tin quản trị.';
    } else if (expectedStatus === '401') {
      resultExpect += 'Báo lỗi unauthorized do chưa cung cấp token xác thực.';
    } else if (expectedStatus === '404') {
      resultExpect += 'Báo lỗi student_not_found do bản ghi đã bị xóa hoặc không tồn tại.';
    } else if (expectedStatus === '500') {
      resultExpect += 'Hệ thống bắt lỗi thông qua error-handler, trả về HTTP 500 an toàn.';
    }
  } else {
    step = `1. Khởi tạo Service với Mock Repository / Prisma Client.\n2. Kích hoạt hàm nghiệp vụ tương ứng của ${modName}.\n3. Kiểm tra giá trị trả về hoặc bắt exception.`;
    
    const callMatch = fullBody.match(/service\.([a-zA-Z0-9_]+)\(([\s\S]*?)\)/);
    if (callMatch) {
      const funcName = callMatch[1];
      const args = callMatch[2].trim().replace(/\s+/g, ' ');
      step = `1. Thiết lập Mock Repository / Database cho Service.\n2. Gọi method service.${funcName}() với tham số kiểm thử.\n3. Đối soát kết quả hoặc mã lỗi phát sinh.`;
      data = args ? `Args: ${args.length > 200 ? args.substring(0, 197) + '...' : args}` : `Dữ liệu mock chuẩn của module ${modName}`;
    } else {
      data = `Dữ liệu test fixture trong ${modName}.mock.ts`;
    }

    if (category.includes('Negative') || fullBody.includes('rejects.toThrow') || fullBody.includes('toThrowError')) {
      const errCodeMatch = fullBody.match(/code:\s*['"`]([^'"`]+)['"`]/);
      const statusCodeMatch = fullBody.match(/statuscode:\s*(\d+)/i);
      const code = errCodeMatch ? errCodeMatch[1] : 'ApiError';
      const status = statusCodeMatch ? statusCodeMatch[1] : '4xx';
      resultExpect = `Ném ngoại lệ ApiError với status ${status}, mã lỗi '${code}'.`;
    } else if (category.includes('Network')) {
      resultExpect = 'Ném ngoại lệ lỗi kết nối hoặc Rollback Transaction, không lưu dữ liệu rác.';
    } else if (category.includes('Concurrency')) {
      resultExpect = 'Hệ thống phân giải đụng độ an toàn: phát hiện bản ghi đã bị xóa (P2025/404) hoặc cập nhật nguyên tử, không sinh trạng thái zombie.';
    } else {
      resultExpect = 'Hàm thực thi thành công, trả về đúng kiểu dữ liệu, các phương thức mock được gọi đúng tham số.';
    }
  }

  return {
    TCID: tcid,
    'Test Title': cleanTitle,
    'Test Summary': category,
    Step: step,
    Data: data,
    'Result Expect': resultExpect
  };
}

let grandTotal = 0;

for (const mod of modules) {
  const testDir = path.join(modulesDir, mod, 'test');
  if (!fs.existsSync(testDir)) continue;

  const modCases = [];

  const unitDir = path.join(testDir, 'unit-test');
  if (fs.existsSync(unitDir)) {
    for (const f of fs.readdirSync(unitDir)) {
      if (f.endsWith('.spec.ts')) {
        modCases.push(...parseTestFile(path.join(unitDir, f), false, mod));
      }
    }
  }

  const intDir = path.join(testDir, 'integration-test');
  if (fs.existsSync(intDir)) {
    for (const f of fs.readdirSync(intDir)) {
      if (f.endsWith('.spec.ts')) {
        modCases.push(...parseTestFile(path.join(intDir, f), true, mod));
      }
    }
  }

  if (modCases.length > 0) {
    grandTotal += modCases.length;
    allSheetsData[mod] = modCases;

    const worksheet = xlsx.utils.json_to_sheet(modCases, {
      header: ['TCID', 'Test Title', 'Test Summary', 'Step', 'Data', 'Result Expect']
    });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 18 }, // TCID
      { wch: 48 }, // Test Title
      { wch: 40 }, // Test Summary
      { wch: 45 }, // Step
      { wch: 35 }, // Data
      { wch: 48 }  // Result Expect
    ];

    const sheetName = mod.length > 30 ? mod.substring(0, 30) : mod;
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  }
}

const outputPath = path.resolve('../English_App_Backend_TestCases.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log(`[OK] Đã xuất thành công ${grandTotal} test cases vào file: ${outputPath}`);
console.log(`[OK] Tổng số sheet tạo: ${Object.keys(allSheetsData).length}`);

// Generate Google Apps Script file
const gasCode = `/**
 * GOOGLE APPS SCRIPT ĐỒNG BỘ TOÀN BỘ ${grandTotal} TEST CASES VÀO GOOGLE SHEET
 * Hướng dẫn sử dụng:
 * 1. Mở file Google Sheet: https://docs.google.com/spreadsheets/d/1EvdRJjuI5xfPb_B_put6StR6Dq-YLQmE8tkvc_6qFVM/edit
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa code cũ, dán toàn bộ nội dung file này vào và bấm 'Save' (biểu tượng đĩa mềm)
 * 4. Bấm 'Run' (Chạy). Toàn bộ 24 sheets tương ứng 24 modules sẽ được tạo và điền tự động!
 */
function importAllTestCases() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ${JSON.stringify(allSheetsData, null, 2)};
  
  const headers = ["TCID", "Test Title", "Test Summary", "Step", "Data", "Result Expect"];
  
  for (const sheetName in data) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }
    
    // Header styling
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, 6);
    headerRange.setFontWeight("bold")
               .setBackground("#1F4E78")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
               
    const rows = data[sheetName].map(item => [
      item["TCID"],
      item["Test Title"],
      item["Test Summary"],
      item["Step"],
      item["Data"],
      item["Result Expect"]
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows).setWrap(true);
    }
    
    // Auto resize
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 320);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(4, 320);
    sheet.setColumnWidth(5, 250);
    sheet.setColumnWidth(6, 320);
  }
  
  SpreadsheetApp.getUi().alert("Hoàn thành! Đã tạo và cập nhật " + Object.keys(data).length + " sheets với đầy đủ test cases.");
}
`;

fs.writeFileSync(path.resolve('../import_to_google_sheets.js'), gasCode, 'utf-8');
console.log('[OK] Đã tạo file Google Apps Script: /Users/mac/English-App/import_to_google_sheets.js');
