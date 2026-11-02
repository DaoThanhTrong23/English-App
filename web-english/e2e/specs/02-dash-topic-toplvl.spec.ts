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
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 02: Dashboard, Topics & Topic Levels (UI-DASH, UI-TOPIC, UI-TOPLVL)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 4: UI-DASH-01 .. UI-DASH-07
  // =========================================================================
  describe('4. Trang Tổng quan Hệ thống (/admin/dashboard)', () => {
    it('[UI-DASH-01] Kiểm thử hiển thị thẻ thống kê (Metric Cards UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Học viên đăng ký');
      const cardsCount = (await page.$$('.bento-stat')).length;
      assert.equal(cardsCount, 4);
      const text = await getBodyText(page);
      assert.ok(text.includes('1,250') || text.includes('1.250'));
      assert.ok(text.includes('3,200') || text.includes('3.200'));
    });

    it('[UI-DASH-02] Kiểm thử hiệu ứng tải trang (Loading State UI)', async () => {
      const state = resetState();
      state.artificialDelayMs = 450;
      const navPromise = loginAndGoto(page, '/admin/dashboard');
      await sleep(150);
      const isLoading = await page.evaluate(() => {
        const hasSpin = Boolean(document.querySelector('.spinning'));
        const hasDots = (document.body.innerText || '').includes('...');
        return hasSpin || hasDots;
      });
      assert.equal(isLoading, true);
      state.artificialDelayMs = 0;
      await navPromise;
      await waitForText(page, 'Học viên đăng ký');
    });

    it('[UI-DASH-03] Kiểm thử làm mới dữ liệu (Refresh Data Action)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Làm mới');
      const beforeCount = state.requests.filter((r) => r.pathname === '/admin/dashboard/stats').length;
      await clickByText(page, 'button', 'Làm mới');
      await sleep(250);
      const afterCount = state.requests.filter((r) => r.pathname === '/admin/dashboard/stats').length;
      assert.ok(afterCount > beforeCount);
    });

    it('[UI-DASH-04] Kiểm thử trực quan hóa dữ liệu biểu đồ tròn (Pie Chart UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Phân bố trình độ CEFR');
      const text = await getBodyText(page);
      assert.ok(text.includes('Phân bố trình độ CEFR'));
      assert.ok(await page.$('.bento-pie'));
    });

    it('[UI-DASH-05] Kiểm thử trực quan hóa dữ liệu biểu đồ miền (Area Chart UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Lưu lượng truy cập (7 ngày gần nhất)');
      const text = await getBodyText(page);
      assert.ok(text.includes('Lưu lượng truy cập (7 ngày gần nhất)'));
      assert.ok(await page.$('.bento-traffic'));
    });

    it('[UI-DASH-06] Kiểm thử hiển thị danh sách Top Leaderboard (UI Table Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Vinh danh Top 5 học viên');
      await waitForText(page, 'MinhAnh99');
      const text = await getBodyText(page);
      assert.ok(text.includes('MinhAnh99'));
      assert.ok(text.includes('HoangNam'));
      assert.ok(text.includes('LanHuong'));
      assert.ok(await page.$('.bento-leaderboard'));
    });

    it('[UI-DASH-07] Kiểm thử xử lý sự cố lỗi mạng (Error Handling UI)', async () => {
      const state = resetState();
      state.customRules.push({
        once: true,
        matcher: (m, p) => m === 'GET' && p === '/admin/dashboard/stats',
        handler: () => ({ status: 500, body: { message: 'Internal Server Error' } }),
      });
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'Không thể kết nối đến máy chủ');
      await clickByText(page, 'button', 'Thử lại');
      await waitForText(page, '1,250');
      const textAfter = await getBodyText(page);
      assert.ok(!textAfter.includes('Không thể kết nối đến máy chủ'));
    });
  });

  // =========================================================================
  // GROUP 5: UI-TOPIC-01 .. UI-TOPIC-12
  // =========================================================================
  describe('5. Quản lý Chủ đề (/admin/topics)', () => {
    it('[UI-TOPIC-01] Kiểm thử hiển thị danh sách chủ đề (UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      const headers = await page.$$eval('.course-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.includes('Tên chủ đề'));
      assert.ok(headers.includes('Hình ảnh'));
      assert.ok(headers.includes('Số bài học'));
      const rows = await page.$$('.course-table tbody tr');
      assert.equal(rows.length, 3);
    });

    it('[UI-TOPIC-02] Kiểm thử lọc dữ liệu (Filter by CEFR)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await setSelectValue(page, '.filter-select', 'B2');
      await sleep(200);
      const text = await getBodyText(page);
      assert.ok(text.includes('Business English'));
      assert.ok(!text.includes('Daily Conversations'));
    });

    it('[UI-TOPIC-03] Kiểm thử sắp xếp danh sách (Sorting UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('th[title="Bấm để sắp xếp"]');
      await sleep(100);
      const firstRowTitle = await page.$eval('.course-table tbody tr:first-child strong', (el) => el.textContent || '');
      assert.equal(firstRowTitle, 'Academic Research');
    });

    it('[UI-TOPIC-04] Kiểm thử giao diện Modal thêm mới (Create Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await page.click('.add-course-btn');
      await sleep(100);
      const modalTitle = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(modalTitle, 'Thêm chủ đề mới');
      assert.ok(await page.$('.modal-content input[type="text"]'));
      assert.ok(await page.$('.modal-content select'));
      assert.ok(await page.$('.modal-content textarea'));
    });

    it('[UI-TOPIC-05] Kiểm thử kiểm tra tính hợp lệ dữ liệu (Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/topics');
      await page.click('.add-course-btn');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/topics').length, 0);
    });

    it('[UI-TOPIC-06] Kiểm thử tải tệp hình ảnh (Image Upload UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await page.click('.add-course-btn');
      await sleep(100);
      const filePath = createTempFile('topic-cover.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
      const fileInput = await page.$('.modal-content input[type="file"]');
      assert.ok(fileInput);
      await fileInput.uploadFile(filePath);
      await sleep(200);
      const previewImg = await page.$('.modal-content img[alt="Preview"]');
      assert.ok(previewImg);
    });

    it('[UI-TOPIC-07] Kiểm thử chức năng chuẩn (Happy Path Create Topic)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Travel & Tourism');
      await setSelectValue(page, '.modal-content select', 'A2');
      await setInputValue(page, '.modal-content textarea', 'Chủ đề du lịch quốc tế');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Travel & Tourism');
      const text = await getBodyText(page);
      assert.ok(text.includes('Travel & Tourism'));
    });

    it('[UI-TOPIC-08] Kiểm thử giao diện cập nhật (Edit Modal UI & Data Preload)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.course-table .btn-edit');
      await sleep(100);
      const modalTitle = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      const inputVal = await page.$eval('.modal-content input[type="text"]', (el) => (el as HTMLInputElement).value);
      assert.equal(modalTitle, 'Sửa chủ đề');
      assert.equal(inputVal, 'Daily Conversations');
    });

    it('[UI-TOPIC-09] Kiểm thử cập nhật dữ liệu (Update Topic Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.course-table .btn-edit');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Daily Conversations Updated');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Daily Conversations Updated');
      const text = await getBodyText(page);
      assert.ok(text.includes('Daily Conversations Updated'));
    });

    it('[UI-TOPIC-10] Kiểm thử xóa mềm (Soft Delete Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.course-table .btn-delete');
      await clickConfirmModal(page, 'confirm');
      await sleep(200);
      const restoreBtns = await page.$$('.course-table .btn-restore');
      assert.equal(restoreBtns.length, 2);
    });

    it('[UI-TOPIC-11] Kiểm thử khôi phục dữ liệu (Restore Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Academic Research');
      await page.click('.course-table .btn-restore');
      await sleep(200);
      const restoreBtns = await page.$$('.course-table .btn-restore');
      assert.equal(restoreBtns.length, 0);
    });

    it('[UI-TOPIC-12] Kiểm thử điều hướng liên kết phân cấp (Parent-Child Navigation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      await waitForText(page, 'Daily Conversations');
      await page.click('.course-table .btn-view-detail');
      await sleep(200);
      assert.ok(page.url().includes('/admin/courses?topicId=1'));
    });
  });

  // =========================================================================
  // GROUP 6: UI-TOPLVL-01 .. UI-TOPLVL-07
  // =========================================================================
  describe('6. Cấu hình Số lượng Chủ đề theo Nhóm Cấp độ (/admin/topic-levels)', () => {
    it('[UI-TOPLVL-01] Kiểm thử hiển thị giao diện cấu hình cấp độ (UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'Cài đặt Chủ đề');
      const text = await getBodyText(page);
      assert.ok(text.includes('A1 - A2'));
      assert.ok(text.includes('B1 - B2'));
      assert.ok(text.includes('C1 - C2'));
      const numInputs = await page.$$('input[type="number"]');
      assert.equal(numInputs.length, 3);
    });

    it('[UI-TOPLVL-02] Kiểm thử tương tác tăng giá trị (Increment Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      const beforeVal = await page.$eval('input[type="number"]', (el) => Number((el as HTMLInputElement).value));
      await page.click('button[title="Tăng 1 chủ đề"]');
      await sleep(80);
      const afterVal = await page.$eval('input[type="number"]', (el) => Number((el as HTMLInputElement).value));
      assert.equal(afterVal, beforeVal + 1);
    });

    it('[UI-TOPLVL-03] Kiểm thử tương tác giảm giá trị (Decrement Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      const beforeVal = await page.$eval('input[type="number"]', (el) => Number((el as HTMLInputElement).value));
      await page.click('button[title="Giảm 1 chủ đề"]');
      await sleep(80);
      const afterVal = await page.$eval('input[type="number"]', (el) => Number((el as HTMLInputElement).value));
      assert.equal(afterVal, beforeVal - 1);
    });

    it('[UI-TOPLVL-04] Kiểm thử giới hạn biên trên (Upper Boundary UI - Max 50)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      await setInputValue(page, 'input[type="number"]', '50');
      await sleep(80);
      const isDisabled = await page.$eval('button[title="Tăng 1 chủ đề"]', (el) => (el as HTMLButtonElement).disabled);
      assert.equal(isDisabled, true);
    });

    it('[UI-TOPLVL-05] Kiểm thử giới hạn biên dưới (Lower Boundary UI - Min 1)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'A1 - A2');
      await setInputValue(page, 'input[type="number"]', '1');
      await sleep(80);
      const isDisabled = await page.$eval('button[title="Giảm 1 chủ đề"]', (el) => (el as HTMLButtonElement).disabled);
      assert.equal(isDisabled, true);
    });

    it('[UI-TOPLVL-06] Kiểm thử hoàn tác về mặc định (Reset to Defaults)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'Khôi phục mặc định');
      await clickByText(page, 'button', 'Khôi phục mặc định');
      await sleep(150);
      const values = await page.$$eval('input[type="number"]', (els) => els.map((e) => Number((e as HTMLInputElement).value)));
      assert.deepEqual(values, [5, 7, 10]);
    });

    it('[UI-TOPLVL-07] Kiểm thử lưu cấu hình (Save Configuration Action)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/topic-levels');
      await waitForText(page, 'Lưu cài đặt');
      await page.click('button[title="Tăng 1 chủ đề"]');
      await clickByText(page, 'button', 'Lưu cài đặt');
      await waitForText(page, 'Đã lưu cài đặt');
      const putReq = state.requests.find((r) => r.method === 'PUT' && r.pathname === '/admin/topic-settings');
      assert.ok(putReq);
      assert.equal(putReq.body.groups['A1-A2'], 6);
    });
  });
});
