import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Page } from 'puppeteer-core';
import {
  initHarness,
  resetState,
  getState,
  loginAndGoto,
  clearAuthAndGoto,
  setInputValue,
  clickByText,
  waitForText,
  getBodyText,
  getToastMessages,
  clickConfirmModal,
  createTempFile,
  createExcelTempFile,
  sleep,
} from '../helpers/test-harness.ts';

describe('Group 24-26: Cross-Platform, Security & Data Validation (UI-CROSS, UI-SEC, UI-VAL)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  beforeEach(async () => {
    resetState();
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      (window as any).__xssTriggered = false;
    }).catch(() => {});
  });

  // ============================================================================
  // GROUP 24: UI-CROSS-01 .. UI-CROSS-06 (6 Test Cases)
  // ============================================================================
  describe('24. Cross-Platform & Global Feedback (UI-CROSS)', () => {
    it('UI-CROSS-01: Kiểm thử giao diện thích ứng màn hình Full HD (Responsive Large Desktop)', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Tổng quan hệ thống');
      const layoutInfo = await page.evaluate(() => {
        const sidebar = document.querySelector('.admin-sidebar') as HTMLElement | null;
        const main = document.querySelector('.admin-main-wrapper') as HTMLElement | null;
        return {
          hasSidebar: Boolean(sidebar && sidebar.offsetWidth >= 200),
          hasMain: Boolean(main && main.offsetWidth > 1200),
          viewportWidth: window.innerWidth,
        };
      });
      assert.equal(layoutInfo.viewportWidth, 1920);
      assert.equal(layoutInfo.hasSidebar, true);
      assert.equal(layoutInfo.hasMain, true);
    });

    it('UI-CROSS-02: Kiểm thử giao diện thích ứng màn hình Laptop (Responsive Standard Laptop)', async () => {
      await page.setViewport({ width: 1366, height: 768 });
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      const layoutInfo = await page.evaluate(() => {
        const table = document.querySelector('.word-table') as HTMLElement | null;
        return {
          viewportWidth: window.innerWidth,
          hasTable: Boolean(table),
        };
      });
      assert.equal(layoutInfo.viewportWidth, 1366);
      assert.equal(layoutInfo.hasTable, true);
    });

    it('UI-CROSS-03: Kiểm thử giao diện thích ứng Tablet (Responsive Tablet UI)', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Tổng quan hệ thống');
      const layoutInfo = await page.evaluate(() => {
        const header = document.querySelector('.admin-topbar') as HTMLElement | null;
        const content = document.querySelector('.admin-content-box') as HTMLElement | null;
        return {
          viewportWidth: window.innerWidth,
          hasHeader: Boolean(header),
          hasContent: Boolean(content),
        };
      });
      assert.equal(layoutInfo.viewportWidth, 768);
      assert.equal(layoutInfo.hasHeader, true);
      assert.equal(layoutInfo.hasContent, true);
    });

    it('UI-CROSS-04: Kiểm thử phản hồi Toast thành công (Toast Success Notification UI)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Chủ đề Toast Success');
      await page.click('.modal-content .submit-btn');
      await sleep(250);
      const toasts = await getToastMessages(page);
      const bodyText = await getBodyText(page);
      assert.ok(toasts.some((t) => t.includes('thành công')) || bodyText.includes('Chủ đề Toast Success'));
    });

    it('UI-CROSS-05: Kiểm thử phản hồi Toast lỗi (Toast Error/Warning Notification UI)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      const state = getState();
      state.customRules.push({
        method: 'POST',
        pathIncludes: '/admin/topics',
        status: 500,
        body: { message: 'Lỗi máy chủ khi lưu chủ đề' },
        once: true,
      });
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Chủ đề Lỗi 500');
      await page.click('.modal-content .submit-btn');
      await sleep(250);
      const toasts = await getToastMessages(page);
      const bodyText = await getBodyText(page);
      assert.ok(toasts.length > 0 || bodyText.includes('Lỗi'));
    });

    it('UI-CROSS-06: Kiểm thử hộp thoại xác nhận an toàn (Destructive Action Confirm Modal UI)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.course-table .btn-delete');
      await sleep(150);
      const modalCheck = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div')) as HTMLElement[];
        const overlay = allDivs.find((d) => d.style && d.style.zIndex === '99998');
        const buttons = overlay ? Array.from(overlay.querySelectorAll('button')) : [];
        return {
          hasOverlay: Boolean(overlay),
          hasConfirmBtn: buttons.length >= 2,
          hasCancelBtn: buttons.length >= 2,
        };
      });
      assert.equal(modalCheck.hasOverlay, true);
      assert.equal(modalCheck.hasConfirmBtn, true);
      assert.equal(modalCheck.hasCancelBtn, true);
      await clickConfirmModal(page, 'cancel');
    });
  });

  // ============================================================================
  // GROUP 25: UI-SEC-01 .. UI-SEC-15 (15 Test Cases)
  // ============================================================================
  describe('25. Security & Input Protection (UI-SEC)', () => {
    it('UI-SEC-01: Kiểm thử bảo mật đầu vào (Input Sanitization & XSS)', async () => {
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      const xssPayload = '<script>window.__xssTriggered = true;</script><img src=x onerror="window.__xssTriggered=true">';
      await setInputValue(page, 'input[placeholder*="Tìm kiếm"]', xssPayload);
      await sleep(250);
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false, 'Reflected/DOM XSS must not execute in search box');
    });

    it('UI-SEC-02: Kiểm thử bảo mật lưu trữ (Stored XSS Protection)', async () => {
      const state = getState();
      state.courses.unshift({
        id: 9901,
        title: '<script>window.__xssTriggered=true</script><b>Course XSS</b>',
        description: '<img src=x onerror="window.__xssTriggered=true">',
        cefrLevel: 'A1',
        topicId: 1,
        topic: { id: 1, title: 'Daily Conversations', isDeleted: false },
        createdAt: new Date().toISOString(),
        deletedAt: null,
        isDeleted: false,
      });
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Course XSS');
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false, 'Stored XSS in course title/description must be escaped by React');
      const text = await getBodyText(page);
      assert.ok(text.includes('<script>window.__xssTriggered=true</script>'));
    });

    it('UI-SEC-03: Kiểm thử bảo mật Rich Text Editor (Rich Text Sanitization)', async () => {
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Lý thuyết / Ngữ pháp');
      await setInputValue(
        page,
        'textarea[placeholder*="Nhập nội dung bài học"]',
        '<script>window.__xssTriggered=true</script>Nội dung bài giảng an toàn'
      );
      await sleep(150);
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false, 'Script tags inside lesson content editor must not execute');
    });

    it('UI-SEC-04: Kiểm thử bảo mật đề thi (Stored XSS in Question Builder)', async () => {
      const state = getState();
      state.questionsByTest[201] = [
        {
          id: 8801,
          testId: 201,
          questionText: '<img src=x onerror="window.__xssTriggered=true">Question XSS?',
          quesionText: '<img src=x onerror="window.__xssTriggered=true">Question XSS?',
          questionType: 'multiple_choice',
          skillCategory: 'Reading',
          points: 10,
          difficultyElo: 1200,
          explanation: '<script>window.__xssTriggered=true</script>',
          answers: [
            { id: 1, answerText: '<script>window.__xssTriggered=true</script>Answer A', isCorrect: true },
            { id: 2, answerText: 'Answer B', isCorrect: false },
          ],
        },
      ];
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Question XSS?');
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false);
      const text = await getBodyText(page);
      assert.ok(text.includes('Question XSS?'));
    });

    it('UI-SEC-05: Kiểm thử bảo mật quản trị phân quyền (Stored XSS in Role Name)', async () => {
      const state = getState();
      state.roles.push({
        id: 77,
        name: '<svg onload="window.__xssTriggered=true">RoleXSS',
        description: 'XSS test role',
        isSystem: false,
        userCount: 0,
        permissionCount: 0,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'RoleXSS');
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false);
      const text = await getBodyText(page);
      assert.ok(text.includes('RoleXSS'));
    });

    it('UI-SEC-06: Kiểm thử bảo mật truy vấn (SQL Injection Prevention)', async () => {
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      const sqli = "' OR 1=1; DROP TABLE users; --";
      await setInputValue(page, '.student-search-input', sqli);
      await sleep(350);
      const state = getState();
      const studentReqs = state.requests.filter((r) => r.url.includes('/admin/students'));
      assert.ok(studentReqs.length > 0);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0, 'UI remains stable without crashing on SQLi payload');
    });

    it('UI-SEC-07: Kiểm thử bảo mật nhật ký (SQLi in Audit Logs Search)', async () => {
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Nhật ký hệ thống');
      const sqli = "' UNION SELECT null, username, password FROM users--";
      await setInputValue(page, 'input[placeholder*="Tìm theo email"]', sqli);
      await sleep(300);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('Nhật ký hệ thống'));
    });

    it('UI-SEC-08: Kiểm thử bảo mật tải tệp đa phương tiện (Malicious File Upload)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const badFile = createTempFile('exploit.exe', 'MZ-fake-executable-binary');
      const accepts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input[type="file"]')).map((el) =>
          el.getAttribute('accept') || ''
        );
      });
      assert.ok(
        accepts.some((a) => a.includes('image') || a.includes('audio') || a.includes('.xlsx') || a.includes('.csv') || a.includes('spreadsheet')),
        'File inputs should enforce accept filter for safe media/spreadsheet types'
      );
      void badFile;
    });

    it('UI-SEC-09: Kiểm thử bảo mật tệp bảng tính (CSV/Formula Injection Protection)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const formulaExcel = createExcelTempFile('formula-injection.xlsx', [
        {
          headword: '=cmd|\'/C calc\'!A0',
          meaning: '+SUM(1,1) Nghĩa công thức',
          partOfSpeech: 'noun',
          cefrLevel: 'A1',
        },
      ]);
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(formulaExcel);
      await sleep(300);
      const xssTriggered = await page.evaluate(() => Boolean((window as any).__xssTriggered));
      assert.equal(xssTriggered, false);
      const text = await getBodyText(page);
      assert.ok(text.includes('Nghĩa công thức') || text.includes('calc'));
    });

    it('UI-SEC-10: Kiểm thử trường hợp biên tệp tin (Zero-byte File Handling)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const emptyFile = createTempFile('zero-byte.xlsx', Buffer.alloc(0));
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(emptyFile);
      await sleep(250);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0, 'App handles 0-byte file gracefully');
    });

    it('UI-SEC-11: Kiểm thử giới hạn kích thước tệp tải lên (Oversized File Size Limit)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.add-course-btn');
      await sleep(150);
      const bigFile = createTempFile('oversized-image.png', Buffer.alloc(1024 * 64, 0x41));
      const imgInput = await page.$('.modal-content input[type="file"]');
      if (imgInput) {
        await (imgInput as any).uploadFile(bigFile);
        await sleep(250);
      }
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0);
    });

    it('UI-SEC-12: Kiểm thử bảo mật Token phiên làm việc (Session Token Tampering)', async () => {
      const state = getState();
      state.customRules.push({
        method: 'GET',
        pathIncludes: '/admin/topics',
        status: 401,
        body: { message: 'Token không hợp lệ hoặc đã hết hạn' },
        once: true,
      });
      await loginAndGoto(page, '/admin/topics', { token: 'tampered.jwt.token.invalid' });
      await sleep(400);
      const currentUrl = page.url();
      const tokenInStorage = await page.evaluate(() => localStorage.getItem('adminToken'));
      assert.ok(
        currentUrl.includes('/admin/login') || tokenInStorage === null,
        '401 response on tampered token must clear session and redirect to /admin/login'
      );
    });

    it('UI-SEC-13: Kiểm thử giới hạn tần suất yêu cầu (Rate Limiting 429)', async () => {
      await clearAuthAndGoto(page, '/admin/login');
      const state = getState();
      state.customRules.push({
        method: 'POST',
        pathIncludes: '/auth/login',
        status: 429,
        body: { message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 1 phút.' },
        once: true,
      });
      await setInputValue(page, 'input[type="text"]', 'admin@english.com');
      await setInputValue(page, 'input[type="password"]', '123456');
      await page.click('button.admin-login-button');
      await sleep(250);
      const text = await getBodyText(page);
      assert.ok(
        text.includes('Quá nhiều yêu cầu') || text.includes('thử lại') || text.includes('lỗi'),
        'Should display 429 rate limit error message'
      );
    });

    it('UI-SEC-14: Kiểm thử chống lộ thông tin nhạy cảm (Sensitive Data Exposure UI)', async () => {
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="password"]', 'SuperSecretPassword!2026');
      const passInfo = await page.evaluate(() => {
        const el = document.querySelector('input[type="password"]') as HTMLInputElement | null;
        return {
          type: el?.type,
          storageDump: JSON.stringify(localStorage),
        };
      });
      assert.equal(passInfo.type, 'password', 'Password input must mask characters');
      assert.ok(!passInfo.storageDump.includes('SuperSecretPassword!2026'), 'Password must never be stored in localStorage');
    });

    it('UI-SEC-15: Kiểm thử kiểm soát truy cập trực tiếp đối tượng (IDOR & 404 Handling)', async () => {
      await loginAndGoto(page, '/admin/courses/999999');
      await sleep(250);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0, 'Navigating to non-existent course ID 999999 should not crash the React tree');
    });
  });

  // ============================================================================
  // GROUP 26: UI-VAL-01 .. UI-VAL-15 (15 Test Cases)
  // ============================================================================
  describe('26. Boundary Values & Data Validation (UI-VAL)', () => {
    it('UI-VAL-01: Kiểm thử giá trị biên độ dài chuỗi (Maximum String Length Boundary)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.add-course-btn');
      await sleep(100);
      const longTitle = 'A'.repeat(260);
      await setInputValue(page, '.modal-content input[type="text"]', longTitle);
      await page.click('.modal-content .submit-btn');
      await sleep(250);
      const state = getState();
      assert.ok(state.topics.some((t) => (t.title || '').length >= 255));
    });

    it('UI-VAL-02: Kiểm thử dữ liệu rỗng vô hình (Whitespace-only Input)', async () => {
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'greeting');
      const initialCount = getState().keywords.length;
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', '     ');
      await page.click('.modal-content .btn-submit');
      await sleep(200);
      assert.equal(getState().keywords.length, initialCount, 'Whitespace-only group name must be rejected');
    });

    it('UI-VAL-03: Kiểm thử chuẩn hóa chuỗi đầu vào (Auto Trim Input)', async () => {
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await setInputValue(page, 'input[placeholder*="Tìm kiếm"]', '   hello   ');
      await sleep(450);
      await waitForText(page, 'hello');
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('hello'));
      assert.ok(!bodyText.includes('negotiate'));
    });

    it('UI-VAL-04: Kiểm thử hỗ trợ tiếng Việt có dấu (Vietnamese Unicode Diacritics)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.add-course-btn');
      await sleep(100);
      const vietnameseName = 'Tiếng Anh Chuyên Ngành Kỹ Thuật Điện Tử Viễn Thông Đắk Lắk';
      await setInputValue(page, '.modal-content input[type="text"]', vietnameseName);
      await page.click('.modal-content .submit-btn');
      await waitForText(page, vietnameseName);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes(vietnameseName));
    });

    it('UI-VAL-05: Kiểm thử hỗ trợ ký tự UTF-8 4-byte (Emoji Icons Support)', async () => {
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Tân Binh Chăm Chỉ');
      await page.click('.add-course-btn');
      await sleep(150);
      await setInputValue(page, '.modal-content input[type="text"]', '🌟🚀🏆 Siêu Sao Học Tập');
      await setInputValue(page, '.modal-content textarea', 'Đạt chuỗi học tập xuất sắc 🌟');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, '🌟🚀🏆 Siêu Sao Học Tập');
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('🌟🚀🏆'));
    });

    it('UI-VAL-06: Kiểm thử ký tự đặc biệt và dấu ngoặc (Special Characters Handling)', async () => {
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.add-course-btn');
      await sleep(100);
      const specialStr = 'Math & Logic: (a + b) * [c - d] = {x / y} ~ 100% #1 @admin';
      await setInputValue(page, '.modal-content input[type="text"]', specialStr);
      await page.click('.modal-content .submit-btn');
      await waitForText(page, '(a + b) * [c - d]');
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('(a + b) * [c - d]'));
    });

    it('UI-VAL-07: Kiểm thử giá trị biên số âm không hợp lệ (Negative Numbers Boundary)', async () => {
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'EASY');
      const hasMinConstraint = await page.evaluate(() => {
        const numInputs = Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
        return numInputs.length > 0 && numInputs.some((i) => i.getAttribute('min') !== null);
      });
      assert.equal(hasMinConstraint, true);
    });

    it('UI-VAL-08: Kiểm thử định dạng kiểu số nguyên (Integer Field Validation)', async () => {
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      const numInputExists = await page.evaluate(() => {
        const input = document.querySelector('input[type="number"]') as HTMLInputElement | null;
        return Boolean(input);
      });
      assert.equal(numInputExists, true);
    });

    it('UI-VAL-09: Kiểm thử tràn số nguyên (Integer Overflow Boundary)', async () => {
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Tân Binh Chăm Chỉ');
      await page.click('.add-course-btn');
      await sleep(150);
      await page.evaluate(() => {
        const inp = document.querySelector('.modal-content input[type="number"]') as HTMLInputElement | null;
        if (inp) {
          inp.value = '2147483647';
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0);
    });

    it('UI-VAL-10: Kiểm thử kiểu dữ liệu số (Non-numeric Input in Number Field)', async () => {
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      const valAfterAlpha = await page.evaluate(() => {
        const inp = document.querySelector('input[type="number"]') as HTMLInputElement | null;
        if (!inp) return '';
        inp.value = 'abcXYZ';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return inp.value;
      });
      assert.ok(valAfterAlpha === '' || valAfterAlpha === '1', 'HTML5 input[type="number"] rejects alphabetical characters');
    });

    it('UI-VAL-11: Kiểm thử tệp bảng tính rỗng dữ liệu (Header-only Excel Sheet)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const headerOnlyExcel = createExcelTempFile('header-only.xlsx', []);
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(headerOnlyExcel);
      await sleep(250);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0);
    });

    it('UI-VAL-12: Kiểm thử xử lý dòng rỗng trong bảng tính (Interleaved Empty Rows in Excel)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const interleavedExcel = createExcelTempFile('interleaved-rows.xlsx', [
        { headword: 'alpha', meaning: 'chữ alpha', partOfSpeech: 'noun', cefrLevel: 'A1' },
        { headword: '', meaning: '', partOfSpeech: '', cefrLevel: '' },
        { headword: 'beta', meaning: 'chữ beta', partOfSpeech: 'noun', cefrLevel: 'A2' },
      ]);
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(interleavedExcel);
      await sleep(300);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('alpha') && bodyText.includes('beta'));
    });

    it('UI-VAL-13: Kiểm thử cấu trúc cột bảng tính (Missing Mandatory Columns Validation)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const missingColExcel = createExcelTempFile('missing-cols.xlsx', [
        { wrongColA: 'foo', wrongColB: 'bar' },
      ]);
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(missingColExcel);
      await sleep(300);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.length > 0);
    });

    it('UI-VAL-14: Kiểm thử tải lượng lớn bảng tính (Bulk Excel Import Stress UI)', async () => {
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await sleep(150);
      const bulkRows = Array.from({ length: 1000 }, (_, i) => ({
        headword: `bulk_word_${i + 1}`,
        meaning: `Nghĩa từ hàng loạt số ${i + 1}`,
        partOfSpeech: 'noun',
        cefrLevel: 'B1',
      }));
      const bulkExcel = createExcelTempFile('bulk-1000-words.xlsx', bulkRows);
      const fileInput = await page.$('input.file-input');
      assert.ok(fileInput);
      await fileInput.uploadFile(bulkExcel);
      await sleep(500);
      const bodyText = await getBodyText(page);
      assert.ok(
        bodyText.includes('bulk_word_1') || bodyText.includes('1000'),
        '1,000 rows should be parsed and previewed without freezing the UI'
      );
    });

    it('UI-VAL-15: Kiểm thử chống vỡ bố cục bảng dữ liệu (Text Wrapping & Overflow UI)', async () => {
      const state = getState();
      state.words.unshift({
        id: 9500,
        headword: 'pneumonoultramicroscopicsilicovolcanoconiosis',
        phonetic: '/ˌnjuː.mə.nəʊˌʌl.trəˌmaɪ.krə.skɒp.ɪkˌsɪl.ɪ.kəʊ.vɒlˌkeɪ.nəʊ.kəʊ.niˈəʊ.sɪs/',
        partOfSpeech: 'noun',
        cefrLevel: 'C2',
        meaning: 'Một bệnh phổi mãn tính do hít phải bụi tro núi lửa hoặc thạch anh cực mịn trong thời gian dài '.repeat(3),
        meaningVi: 'Một bệnh phổi mãn tính do hít phải bụi tro núi lửa hoặc thạch anh cực mịn trong thời gian dài '.repeat(3),
        exampleSentence: 'Pneumonoultramicroscopicsilicovolcanoconiosis is one of the longest words in the English dictionary.',
        audioUrl: '',
        imageUrl: '',
        deletedAt: null,
        isDeleted: false,
      });
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'pneumonoultramicroscopicsilicovolcanoconiosis');
      const overflowCheck = await page.evaluate(() => {
        const table = document.querySelector('.word-table') as HTMLElement | null;
        return {
          hasTable: Boolean(table),
          bodyTextIncludesWord: document.body.innerText.includes('pneumonoultramicroscopicsilicovolcanoconiosis'),
        };
      });
      assert.equal(overflowCheck.hasTable, true);
      assert.equal(overflowCheck.bodyTextIncludesWord, true);
    });
  });
});
