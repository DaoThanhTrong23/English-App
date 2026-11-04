import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Page } from 'puppeteer-core';
import {
  initHarness,
  resetState,
  loginAndGoto,
  setInputValue,
  setSelectValue,
  clickByText,
  waitForText,
  getBodyText,
  clickConfirmModal,
  createTempFile,
  createExcelTempFile,
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 05: Tests, Questions & Test Results (UI-TEST, UI-TSTDTL, UI-TSTRES)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 11: UI-TEST-01 .. UI-TEST-11
  // =========================================================================
  describe('11. Quản lý Đề thi (/admin/tests)', () => {
    it('[UI-TEST-01] Kiểm thử giao diện phân loại bài thi (Test Tabs UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Đề kiểm tra đầu vào');
      const tabs = await page.$$eval('.test-category-tab', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.equal(tabs.length, 3);
      assert.ok(tabs[0].includes('Đề kiểm tra đầu vào'));
      assert.ok(tabs[1].includes('Bài tập theo bài học'));
      assert.ok(tabs[2].includes('Tất cả bài thi'));
    });

    it('[UI-TEST-02] Kiểm thử chuyển tab lọc bài thi (Tab Filtering UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      await clickByText(page, '.test-category-tab', 'Bài tập theo bài học');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Luyện Nghe: Greetings and Introductions'));
      assert.ok(!text.includes('Placement Test Toàn Diện 2026'));
    });

    it('[UI-TEST-03] Kiểm thử tìm kiếm đề thi (Search Test UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await clickByText(page, '.test-category-tab', 'Tất cả bài thi');
      await sleep(400);
      await setInputValue(page, '.search-input', 'Midterm');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Midterm Assessment A1-A2'));
      assert.ok(!text.includes('Placement Test Toàn Diện 2026'));
    });

    it('[UI-TEST-04] Kiểm thử lọc theo nhóm trình độ (Filter by Level Group)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await clickByText(page, '.test-category-tab', 'Tất cả bài thi');
      await sleep(400);
      await setSelectValue(page, '.test-filters .filter-select', 'A');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Midterm Assessment A1-A2'));
    });

    it('[UI-TEST-05] Kiểm thử hiển thị thẻ đề thi (Test Card UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      const card = await page.$('.test-card');
      assert.ok(card);
      const text = await page.$eval('.test-card', (el) => el.textContent || '');
      assert.ok(text.includes('Placement Test Toàn Diện 2026'));
      assert.ok(text.includes('Số câu hỏi:'));
      assert.ok(text.includes('Xem chi tiết'));
      assert.ok(text.includes('Kết quả thi'));
    });

    it('[UI-TEST-06] Kiểm thử Modal tạo đề thi (Create Test Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      await clickByText(page, 'button', 'Tạo bài thi mới');
      await sleep(100);
      const modalHead = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(modalHead, 'Tạo bài thi mới');
    });

    it('[UI-TEST-07] Kiểm thử kiểm tra tính hợp lệ dữ liệu đề thi (Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/tests');
      await clickByText(page, 'button', 'Tạo bài thi mới');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/tests').length, 0);
    });

    it('[UI-TEST-08] Kiểm thử chức năng chuẩn (Happy Path Create Test)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await clickByText(page, '.test-category-tab', 'Tất cả bài thi');
      await sleep(350);
      await clickByText(page, 'button', 'Tạo bài thi mới');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Final Test B1');
      await setSelectValue(page, '.modal-content select', 'B1');
      await setInputValue(page, '.modal-content textarea', 'Bài kiểm tra cuối kỳ trình độ B1');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Final Test B1');
      const text = await getBodyText(page);
      assert.ok(text.includes('Final Test B1'));
    });

    it('[UI-TEST-09] Kiểm thử cập nhật thông số đề thi (Edit Test Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      await page.click('.test-card .test-action-btn.edit');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Placement Test 2026 Updated');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Placement Test 2026 Updated');
      const text = await getBodyText(page);
      assert.ok(text.includes('Placement Test 2026 Updated'));
    });

    it('[UI-TEST-10] Kiểm thử xóa đề thi (Delete Test Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      const beforeCount = (await page.$$('.test-card')).length;
      await page.click('.test-card .test-action-btn.delete');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Xóa bài thi thành công');
      await sleep(200);
      const cards = await page.$$('.test-card');
      assert.equal(cards.length, beforeCount - 1);
    });

    it('[UI-TEST-11] Kiểm thử điều hướng đến trang biên soạn câu hỏi (Navigate to Test Detail)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests');
      await waitForText(page, 'Placement Test Toàn Diện 2026');
      await clickByText(page, '.test-manage-questions-btn', 'Xem chi tiết');
      await waitForText(page, 'Quản lý câu hỏi (Bài thi #201)');
      assert.ok(page.url().includes('/admin/tests/201'));
    });
  });

  // =========================================================================
  // GROUP 12: UI-TSTDTL-01 .. UI-TSTDTL-16
  // =========================================================================
  describe('12. Quản lý Câu hỏi Đề thi (/admin/tests/:testId)', () => {
    it('[UI-TSTDTL-01] Kiểm thử hiển thị danh sách câu hỏi (Question List UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'What is the synonym of "happy"?');
      const cards = await page.$$('.question-card');
      assert.equal(cards.length, 2);
    });

    it('[UI-TSTDTL-02] Kiểm thử huy hiệu kỹ năng và loại câu hỏi (Skill & Type Badges UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Elo 1200');
      const text = await getBodyText(page);
      assert.ok(text.includes('Elo 1200'));
      assert.ok(text.includes('Reading'));
      assert.ok(text.includes('Listening'));
      assert.ok(text.includes('Có Audio'));
      assert.ok(text.includes('Có Ảnh'));
    });

    it('[UI-TSTDTL-03] Kiểm thử hiển thị đáp án đúng (Correct Answer Highlight UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Joyful');
      const correctText = await page.$eval('.answer-item.correct', (el) => el.textContent || '');
      assert.ok(correctText.includes('Joyful'));
      assert.ok(correctText.includes('Đáp án đúng'));
    });

    it('[UI-TSTDTL-04] Kiểm thử Modal thêm câu hỏi (Create Question Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Thêm câu hỏi mới');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const modalHead = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(modalHead, 'Thêm câu hỏi');
    });

    it('[UI-TSTDTL-05] Kiểm thử tương tác chọn loại câu hỏi (Question Types Dropdown)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const optionsCount = await page.$$eval('.modal-content select', (els) => (els[0] as HTMLSelectElement).options.length);
      assert.equal(optionsCount, 5);
      await setSelectValue(page, '.modal-content select:first-of-type', 'speaking');
      await sleep(100);
      const dynamicAnswers = await page.$('.modal-content .dynamic-answers');
      assert.equal(dynamicAnswers, null);
    });

    it('[UI-TSTDTL-06] Kiểm thử nhập độ khó Elo phục vụ FAME-KT (Elo Rating Input)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      await setInputValue(page, 'input[placeholder="1200"]', '1450');
      const val = await page.$eval('input[placeholder="1200"]', (el) => (el as HTMLInputElement).value);
      assert.equal(val, '1450');
    });

    it('[UI-TSTDTL-07] Kiểm thử tải tệp âm thanh câu hỏi (Audio Upload UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const mp3File = createTempFile('q-audio.mp3', 'ID3-mock-mp3');
      const audioInput = await page.$('.modal-content input[accept="audio/*"]');
      assert.ok(audioInput);
      await (audioInput as any).uploadFile(mp3File);
      await waitForText(page, 'Tải file âm thanh thành công');
      const audioVal = await page.$eval('input[placeholder="URL MP3 hoặc tải lên..."]', (el) => (el as HTMLInputElement).value);
      assert.ok(audioVal.startsWith('http'));
    });

    it('[UI-TSTDTL-08] Kiểm thử tải ảnh minh họa câu hỏi (Image Upload UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const imgFile = createTempFile('q-img.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
      const imgInput = await page.$('.modal-content input[accept="image/*"]');
      assert.ok(imgInput);
      await (imgInput as any).uploadFile(imgFile);
      await waitForText(page, 'Tải hình ảnh thành công');
      const imgVal = await page.$eval('input[placeholder="URL Hình ảnh hoặc tải lên..."]', (el) => (el as HTMLInputElement).value);
      assert.ok(imgVal.startsWith('http'));
    });

    it('[UI-TSTDTL-09] Kiểm thử tùy biến số lượng đáp án (Dynamic Answers UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const initialRows = (await page.$$('.dynamic-answer-row')).length;
      assert.equal(initialRows, 4);
      await page.click('.add-answer-btn');
      await sleep(80);
      assert.equal((await page.$$('.dynamic-answer-row')).length, 5);
      await page.click('.remove-answer-btn');
      await sleep(80);
      assert.equal((await page.$$('.dynamic-answer-row')).length, 4);
    });

    it('[UI-TSTDTL-10] Kiểm thử chọn đáp án đúng duy nhất (Single Correct Answer Radio UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const radios = await page.$$('.dynamic-answer-row input[type="radio"]');
      assert.equal(radios.length, 4);
      await radios[2].click();
      await sleep(80);
      const checkedStates = await page.$$eval('.dynamic-answer-row input[type="radio"]', (els) =>
        els.map((e) => (e as HTMLInputElement).checked)
      );
      assert.deepEqual(checkedStates, [false, false, true, false]);
    });

    it('[UI-TSTDTL-11] Kiểm thử kiểm tra tính hợp lệ dữ liệu câu hỏi (Question Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/tests/201/questions').length, 0);
    });

    it('[UI-TSTDTL-12] Kiểm thử chức năng chuẩn (Happy Path Create Question)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await clickByText(page, 'button', 'Thêm câu hỏi mới');
      await sleep(100);
      await setInputValue(page, '.modal-content textarea', 'Which planet is closest to the Sun?');
      await setInputValue(page, 'input[placeholder="Đáp án 1"]', 'Mercury');
      await setInputValue(page, 'input[placeholder="Đáp án 2"]', 'Venus');
      await setInputValue(page, 'input[placeholder="Đáp án 3"]', 'Earth');
      await setInputValue(page, 'input[placeholder="Đáp án 4"]', 'Mars');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Which planet is closest to the Sun?');
      const text = await getBodyText(page);
      assert.ok(text.includes('Which planet is closest to the Sun?'));
    });

    it('[UI-TSTDTL-13] Kiểm thử cập nhật câu hỏi (Edit Question Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'What is the synonym of "happy"?');
      await page.click('.question-card .test-action-btn.edit');
      await sleep(100);
      await setInputValue(page, '.modal-content textarea', 'What is the best synonym of "happy"?');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'What is the best synonym of "happy"?');
      const text = await getBodyText(page);
      assert.ok(text.includes('What is the best synonym of "happy"?'));
    });

    it('[UI-TSTDTL-14] Kiểm thử xóa câu hỏi (Delete Question Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'What is the synonym of "happy"?');
      await page.click('.question-card .test-action-btn.delete');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Xóa câu hỏi thành công');
      const cards = await page.$$('.question-card');
      assert.equal(cards.length, 1);
    });

    it('[UI-TSTDTL-15] Kiểm thử tải biểu mẫu câu hỏi Excel (Download Question Template)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Tải file mẫu');
      await clickByText(page, 'button', 'Tải file mẫu');
      await sleep(100);
    });

    it('[UI-TSTDTL-16] Kiểm thử nhập câu hỏi hàng loạt từ Excel (Batch Import Questions Execution)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201');
      await waitForText(page, 'Nhập Excel');
      const xlsxPath = createExcelTempFile('questions.xlsx', [
        { 'Câu hỏi': 'Imported Question from Excel: Choose the correct verb form.', 'Loại': 'Trắc nghiệm', 'Điểm': 10 },
      ]);
      const fileInput = await page.$('input[type="file"][accept=".xlsx, .xls"]');
      assert.ok(fileInput);
      await fileInput.uploadFile(xlsxPath);
      await waitForText(page, 'Imported Question from Excel');
      const text = await getBodyText(page);
      assert.ok(text.includes('Imported Question from Excel'));
    });
  });

  // =========================================================================
  // GROUP 13: UI-TSTRES-01 .. UI-TSTRES-05
  // =========================================================================
  describe('13. Kết quả Thi của Học viên (/admin/tests/:testId/results)', () => {
    it('[UI-TSTRES-01] Kiểm thử hiển thị bảng kết quả thi (Test Results Table UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201/results');
      await waitForText(page, 'MinhAnh99');
      const headers = await page.$$eval('table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.includes('Tên Học Viên'));
      assert.ok(headers.includes('Email'));
      assert.ok(headers.includes('Điểm Số'));
      assert.ok(headers.includes('Ngày Thi'));
    });

    it('[UI-TSTRES-02] Kiểm thử màu sắc/hiển thị điểm kết quả (Score Status UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201/results');
      await waitForText(page, 'MinhAnh99');
      const rows = await page.$$('table tbody tr');
      assert.equal(rows.length, 2);
      const text = await getBodyText(page);
      assert.ok(text.includes('85'));
      assert.ok(text.includes('40'));
    });

    it('[UI-TSTRES-03] Kiểm thử hiển thị số liệu kết quả (Score Formatting UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201/results');
      await waitForText(page, 'Kết quả thi: Placement Test Toàn Diện 2026');
      const text = await getBodyText(page);
      assert.ok(text.includes('minhanh@gmail.com'));
      assert.ok(text.includes('hoangnam@gmail.com'));
    });

    it('[UI-TSTRES-04] Kiểm thử trạng thái rỗng chưa có lượt thi (Empty State UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/202/results');
      await waitForText(page, 'Chưa có học viên nào làm bài thi này.');
      const text = await getBodyText(page);
      assert.ok(text.includes('Chưa có học viên nào làm bài thi này.'));
    });

    it('[UI-TSTRES-05] Kiểm thử điều hướng quay lại (Back Navigation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/tests/201/results');
      await waitForText(page, 'Quay lại danh sách');
      await clickByText(page, 'button', 'Quay lại danh sách');
      await sleep(150);
      assert.ok(page.url().endsWith('/admin/tests'));
    });
  });
});
