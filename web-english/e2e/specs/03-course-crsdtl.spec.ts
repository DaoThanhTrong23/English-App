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

describe('Suite 03: Courses & Course Detail (UI-COURSE, UI-CRSDTL)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 7: UI-COURSE-01 .. UI-COURSE-13
  // =========================================================================
  describe('7. Quản lý Bài học / Khóa học (/admin/courses)', () => {
    it('[UI-COURSE-01] Kiểm thử hiển thị bảng dữ liệu (Table Columns UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      const headers = await page.$$eval('.course-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.includes('ID'));
      assert.ok(headers.includes('Tiêu đề'));
      assert.ok(headers.includes('Cấp độ'));
      assert.ok(headers.includes('Hành động'));
    });

    it('[UI-COURSE-02] Kiểm thử tìm kiếm tức thời (Real-time Search UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await setInputValue(page, '.search-input', 'Negotiations');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Office Meetings & Negotiations'));
      assert.ok(!text.includes('Greetings and Introductions'));
    });

    it('[UI-COURSE-03] Kiểm thử bộ lọc danh mục (Dropdown Filter by Topic)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await page.evaluate(() => {
        const selects = document.querySelectorAll('.course-filters .filter-select') as NodeListOf<HTMLSelectElement>;
        const topicSelect = selects[1];
        if (topicSelect) {
          topicSelect.value = '2';
          topicSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Office Meetings & Negotiations'));
      assert.ok(!text.includes('Greetings and Introductions'));
    });

    it('[UI-COURSE-04] Kiểm thử bộ lọc cấp độ (Dropdown Filter by CEFR)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await setSelectValue(page, '.course-filters .filter-select:first-of-type', 'A1');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Greetings and Introductions'));
      assert.ok(!text.includes('Office Meetings & Negotiations'));
    });

    it('[UI-COURSE-05] Kiểm thử kết hợp đa bộ lọc (Combined Filters)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await setInputValue(page, '.search-input', 'Greetings');
      await setSelectValue(page, '.course-filters .filter-select:first-of-type', 'B2');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('Không có bài học nào'));
    });

    it('[UI-COURSE-06] Kiểm thử phân trang bảng (Pagination UI)', async () => {
      const state = resetState();
      for (let i = 1; i <= 12; i++) {
        state.courses.push({
          id: 100 + i,
          title: `Extra Lesson ${i}`,
          cefrLevel: 'B1',
          topicId: 1,
          description: 'Mô tả bài học mở rộng',
          createdAt: new Date().toISOString(),
          deletedAt: null,
          isDeleted: false,
          words: [],
        });
      }
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Trang 1 / 2');
      await clickByText(page, '.page-btn', 'Sau');
      await waitForText(page, 'Trang 2 / 2');
      const text = await getBodyText(page);
      assert.ok(text.includes('Trang 2 / 2'));
    });

    it('[UI-COURSE-07] Kiểm thử giao diện Modal thêm bài học (Create Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await page.click('.add-course-btn');
      await sleep(100);
      const title = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(title, 'Thêm bài học mới');
      assert.ok(await page.$('.modal-content input[type="text"]'));
      assert.ok(await page.$('.modal-content textarea'));
    });

    it('[UI-COURSE-08] Kiểm thử kiểm tra tính hợp lệ dữ liệu (Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/courses');
      await page.click('.add-course-btn');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/courses').length, 0);
    });

    it('[UI-COURSE-09] Kiểm thử chức năng chuẩn (Happy Path Create Course)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Small Talk at Work');
      await setInputValue(page, '.modal-content textarea', 'Kỹ năng bắt chuyện nơi công sở');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Small Talk at Work');
      const text = await getBodyText(page);
      assert.ok(text.includes('Small Talk at Work'));
    });

    it('[UI-COURSE-10] Kiểm thử cập nhật bài học (Edit Course Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await page.click('.course-table .btn-edit');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Greetings & Politeness Updated');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Greetings & Politeness Updated');
      const text = await getBodyText(page);
      assert.ok(text.includes('Greetings & Politeness Updated'));
    });

    it('[UI-COURSE-11] Kiểm thử xóa bài học (Delete Course Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await page.click('.course-table .btn-delete');
      await clickConfirmModal(page, 'confirm');
      await sleep(300);
      const restoreBtns = await page.$$('.course-table .btn-restore');
      assert.equal(restoreBtns.length, 2);
    });

    it('[UI-COURSE-12] Kiểm thử khôi phục bài học (Restore Course Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Archived Grammar Lesson');
      await page.click('.course-table .btn-restore');
      await sleep(300);
      const restoreBtns = await page.$$('.course-table .btn-restore');
      assert.equal(restoreBtns.length, 0);
    });

    it('[UI-COURSE-13] Kiểm thử điều hướng đến trang chi tiết (Course Detail Navigation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses');
      await waitForText(page, 'Greetings and Introductions');
      await page.click('.course-table .btn-view-detail');
      await waitForText(page, 'Chi tiết bài học');
      assert.ok(page.url().includes('/admin/courses/10'));
    });
  });

  // =========================================================================
  // GROUP 8: UI-CRSDTL-01 .. UI-CRSDTL-12
  // =========================================================================
  describe('8. Chi tiết Bài học (/admin/courses/:courseId)', () => {
    it('[UI-CRSDTL-01] Kiểm thử giao diện 3 Tabs (3-Tab Navigation Layout)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Chi tiết bài học: Greetings and Introductions');
      const text = await getBodyText(page);
      assert.ok(text.includes('Thông tin chung'));
      assert.ok(text.includes('Từ vựng'));
      assert.ok(text.includes('Bài luyện tập'));
    });

    it('[UI-CRSDTL-02] Kiểm thử thông tin cơ bản bài học (Tab 1 Basic Info UI)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Lưu thay đổi');
      await waitForText(page, 'Cập nhật thông tin Bài học thành công');
      assert.ok(state.requests.some((r) => r.method === 'PUT' && r.pathname === '/admin/courses/10'));
    });

    it('[UI-CRSDTL-03] Kiểm thử tải ảnh bìa bài học (Tab 1 Thumbnail Upload)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Ảnh bìa bài học');
      const filePath = createTempFile('thumb.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
      const inputEl = await page.$('input#course-thumb-upload');
      assert.ok(inputEl);
      await (inputEl as any).uploadFile(filePath);
      await waitForText(page, 'Tải ảnh bìa thành công');
      await clickByText(page, 'button', 'Xóa ảnh');
      await sleep(100);
      const previewEl = await page.$('img[alt="Lesson Thumbnail"]');
      assert.equal(previewEl, null);
    });

    it('[UI-CRSDTL-04] Kiểm thử nhúng video bài giảng (Tab 1 Video Embed UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Video bài giảng YouTube đã sẵn sàng');
      const ytImg = await page.$('img[alt="YouTube Preview"]');
      assert.ok(ytImg);
    });

    it('[UI-CRSDTL-05] Kiểm thử soạn thảo lý thuyết bài giảng (Tab 1 Theory Content Editor)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Lý thuyết / Ngữ pháp');
      await clickByText(page, 'button', '+ Cấu trúc');
      await sleep(100);
      const val = await page.$eval('textarea[placeholder*="Nhập nội dung bài học"]', (el) => (el as HTMLTextAreaElement).value);
      assert.ok(val.includes('👉 Cấu trúc:'));
    });

    it('[UI-CRSDTL-06] Kiểm thử danh sách từ vựng trong bài (Tab 2 Word List UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Từ vựng');
      await waitForText(page, 'Từ vựng trong bài (2)');
      const text = await getBodyText(page);
      assert.ok(text.includes('hello'));
      assert.ok(text.includes('negotiate'));
    });

    it('[UI-CRSDTL-07] Kiểm thử Modal tra cứu từ vựng gán vào bài (Tab 2 Add Word Modal)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Từ vựng');
      await waitForText(page, 'Gán thêm từ vựng');
      await clickByText(page, 'button', 'Gán thêm từ vựng');
      await waitForText(page, 'Chọn từ vựng từ Kho');
      const modalHeading = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.ok(modalHeading.includes('Chọn từ vựng từ Kho'));
    });

    it('[UI-CRSDTL-08] Kiểm thử gán từ vựng hàng loạt vào bài học (Tab 2 Batch Attach Words)', async () => {
      const state = resetState();
      state.words.push({
        id: 1005,
        headword: 'morning',
        phonetic: '/ˈmɔː.nɪŋ/',
        partOfSpeech: 'noun',
        cefrLevel: 'A1',
        meaning: 'buổi sáng',
        meaningVi: 'buổi sáng',
        deletedAt: null,
        isDeleted: false,
      });
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Từ vựng');
      await clickByText(page, 'button', 'Gán thêm từ vựng');
      await waitForText(page, 'morning');
      await clickByText(page, '.modal-content strong', 'morning');
      await sleep(100);
      await clickByText(page, '.modal-content .submit-btn', 'Thêm');
      await waitForText(page, 'Đã thêm từ vựng thành công');
      const text = await getBodyText(page);
      assert.ok(text.includes('Từ vựng trong bài (3)'));
    });

    it('[UI-CRSDTL-09] Kiểm thử gỡ từ vựng (Tab 2 Detach Word Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Từ vựng');
      await waitForText(page, 'Từ vựng trong bài (2)');
      await page.click('.course-table .btn-delete');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Từ vựng trong bài (1)');
      const text = await getBodyText(page);
      assert.ok(text.includes('Từ vựng trong bài (1)'));
    });

    it('[UI-CRSDTL-10] Kiểm thử danh sách bài tập gắn kèm (Tab 3 Test List UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Bài luyện tập');
      await waitForText(page, 'Các bài luyện tập (1)');
      const text = await getBodyText(page);
      assert.ok(text.includes('Luyện Nghe: Greetings and Introductions'));
    });

    it('[UI-CRSDTL-11] Kiểm thử tạo bài tập cho bài học (Tab 3 Create Test Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Thông tin Bài học');
      await clickByText(page, 'button', 'Bài luyện tập');
      await waitForText(page, 'Luyện Nói');
      await clickByText(page, 'button', 'Luyện Nói');
      await waitForText(page, 'Tạo bài luyện tập mới');
      await clickByText(page, '.modal-content .submit-btn', 'Tạo bài luyện tập');
      await waitForText(page, 'Các bài luyện tập (2)');
      const text = await getBodyText(page);
      assert.ok(text.includes('Bài Luyện Nói'));
    });

    it('[UI-CRSDTL-12] Kiểm thử nút quay lại (Back Navigation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/courses/10');
      await waitForText(page, 'Quay lại');
      await clickByText(page, 'button', 'Quay lại');
      await sleep(150);
      assert.ok(page.url().endsWith('/admin/courses'));
    });
  });
});
