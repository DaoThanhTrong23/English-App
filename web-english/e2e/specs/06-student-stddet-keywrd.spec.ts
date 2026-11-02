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
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 06: Students, Student Detail Modal & Keywords (UI-STUDENT, UI-STDDET, UI-KEYWRD)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 14: UI-STUDENT-01 .. UI-STUDENT-09
  // =========================================================================
  describe('14. Quản lý Học viên (/admin/students)', () => {
    it('[UI-STUDENT-01] Kiểm thử hiển thị danh sách học viên (Student Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      const headers = await page.$$eval('.student-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.some((h) => h.includes('Học viên')));
      assert.ok(headers.some((h) => h.includes('Trạng thái')));
      assert.ok(headers.some((h) => h.includes('Điểm XP')));
      const rows = await page.$$('.student-table tbody tr');
      assert.equal(rows.length, 3);
    });

    it('[UI-STUDENT-02] Kiểm thử tìm kiếm học viên (Search Student UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await setInputValue(page, '.student-search-input', 'HoangNam');
      await sleep(450);
      const text = await getBodyText(page);
      assert.ok(text.includes('HoangNam'));
      assert.ok(!text.includes('MinhAnh99'));
    });

    it('[UI-STUDENT-03] Kiểm thử tiêu chí sắp xếp học viên (Sort Student Criteria UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await setSelectValue(page, '.student-sort-select', 'xpPoints');
      await sleep(300);
      const firstStudent = await page.$eval('.student-table tbody tr:first-child .student-name', (el) => el.textContent || '');
      assert.equal(firstStudent, 'MinhAnh99');
    });

    it('[UI-STUDENT-04] Kiểm thử đổi chiều sắp xếp (Sort Direction Toggle UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await setSelectValue(page, '.student-sort-select', 'xpPoints');
      await sleep(250);
      await page.click('.sort-order-btn');
      await sleep(250);
      const firstStudent = await page.$eval('.student-table tbody tr:first-child .student-name', (el) => el.textContent || '');
      assert.equal(firstStudent, 'LockedUser01');
    });

    it('[UI-STUDENT-05] Kiểm thử phân trang học viên (Pagination UI)', async () => {
      const state = resetState();
      for (let i = 1; i <= 10; i++) {
        state.students.push({
          id: 50 + i,
          username: `ExtraStudent${i}`,
          email: `extra${i}@gmail.com`,
          xpPoints: 100 * i,
          isLocked: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          joinedAt: '2026-01-01T00:00:00.000Z',
          lastLoginDate: null,
          lastActiveAt: null,
          lastestActivity: null,
          progress: { totalWordsTracked: 10, masteredWords: 5, learningWords: 5, completedTestCount: 1, achivievementsCount: 0 },
        });
      }
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'Trang 1 / 2');
      await clickByText(page, '.pagination-controls .page-btn', 'Sau');
      await waitForText(page, 'Trang 2 / 2');
      const text = await getBodyText(page);
      assert.ok(text.includes('Trang 2 / 2'));
    });

    it('[UI-STUDENT-06] Kiểm thử khóa tài khoản học viên (Lock Student Account Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('button[title="Khóa tài khoản học viên"]');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Đã khóa tài khoản học viên thành công');
      const unlockBtns = await page.$$('button[title="Mở khóa tài khoản học viên"]');
      assert.equal(unlockBtns.length, 2);
    });

    it('[UI-STUDENT-07] Kiểm thử mở khóa tài khoản (Unlock Student Account Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'LockedUser01');
      await page.click('button[title="Mở khóa tài khoản học viên"]');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Đã mở khóa tài khoản học viên thành công');
      const unlockBtns = await page.$$('button[title="Mở khóa tài khoản học viên"]');
      assert.equal(unlockBtns.length, 0);
    });

    it('[UI-STUDENT-08] Kiểm thử huy hiệu trạng thái tài khoản (Status Badges UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      const text = await getBodyText(page);
      assert.ok(text.includes('Hoạt động'));
      assert.ok(text.includes('Đã khóa'));
    });

    it('[UI-STUDENT-09] Kiểm thử mở Modal hồ sơ học viên (Open Student Detail Modal)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Chi tiết học viên: MinhAnh99');
      assert.ok(await page.$('.student-modal-content'));
    });
  });

  // =========================================================================
  // GROUP 15: UI-STDDET-01 .. UI-STDDET-08
  // =========================================================================
  describe('15. Modal Chi tiết Hồ sơ Học viên (Student Detail Modal)', () => {
    it('[UI-STDDET-01] Kiểm thử thông tin cá nhân trong modal (Modal Profile Section UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Đang hoạt động');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('minhanh@gmail.com'));
      assert.ok(modalText.includes('Đang hoạt động'));
      assert.ok(modalText.includes('15400'));
    });

    it('[UI-STDDET-02] Kiểm thử thẻ chỉ số học tập (Student Progress Summary Cards)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Tổng quan tiến trình');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('140 từ'));
      assert.ok(modalText.includes('480 từ'));
      assert.ok(modalText.includes('85 / 100'));
    });

    it('[UI-STDDET-03] Kiểm thử hiển thị năng lực FAME-KT (Elo 4 Skills Indicators UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Đánh giá năng lực FAME-KT & Trình độ');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('Elo Ngữ pháp'));
      assert.ok(modalText.includes('Elo Từ vựng'));
      assert.ok(modalText.includes('Elo Đọc hiểu'));
      assert.ok(modalText.includes('Elo Nghe hiểu'));
      assert.ok(modalText.includes('1620'));
    });

    it('[UI-STDDET-04] Kiểm thử tab lịch sử làm bài thi (Modal Tests History Tab)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Lịch sử kiểm tra gần đây');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('Placement Test Toàn Diện 2026'));
      assert.ok(modalText.includes('85 / 100'));
    });

    it('[UI-STDDET-05] Kiểm thử tab tiến độ từ vựng SRS (Modal SRS Progress Tab)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Tiến độ học');
      await clickByText(page, '.student-modal-content button', 'Tiến độ học');
      await waitForText(page, 'Tiến độ học từ vựng');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('hello'));
      assert.ok(modalText.includes('Đã thuộc'));
      assert.ok(modalText.includes('Level 5'));
    });

    it('[UI-STDDET-06] Kiểm thử tab lịch sử hội thoại AI của học viên (Modal AI Chat Tab)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Lịch sử Chat AI');
      await clickByText(page, '.student-modal-content button', 'Lịch sử Chat AI');
      await waitForText(page, 'Can you help me practice for a job interview?');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('Of course! Tell me about yourself'));
    });

    it('[UI-STDDET-07] Kiểm thử thao tác khóa trực tiếp từ Modal (Direct Account Status Toggle)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Khóa tài khoản');
      await clickByText(page, '.student-modal-header button', 'Khóa tài khoản');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Mở khóa tài khoản');
      const modalText = await page.$eval('.student-modal-content', (el) => el.textContent || '');
      assert.ok(modalText.includes('Đã khóa tài khoản'));
    });

    it('[UI-STDDET-08] Kiểm thử đóng Modal (Close Modal Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/students');
      await waitForText(page, 'MinhAnh99');
      await page.click('.student-table .view-btn');
      await waitForText(page, 'Chi tiết học viên: MinhAnh99');
      await page.click('.student-modal-header .close-btn');
      await sleep(100);
      assert.equal(await page.$('.student-modal-content'), null);
    });
  });

  // =========================================================================
  // GROUP 16: UI-KEYWRD-01 .. UI-KEYWRD-10
  // =========================================================================
  describe('16. Quản lý Nhóm Từ khóa Gợi ý AI (/admin/keywords)', () => {
    it('[UI-KEYWRD-01] Kiểm thử hiển thị thẻ thống kê từ khóa AI (Keyword Stats Cards UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'Nhóm chủ đề');
      const cards = await page.$$('.keyword-stat-card');
      assert.equal(cards.length, 3);
      const text = await getBodyText(page);
      assert.ok(text.includes('Tổng từ khóa đồng nghĩa'));
      assert.ok(text.includes('Trung bình / nhóm'));
    });

    it('[UI-KEYWRD-02] Kiểm thử hiển thị bảng từ khóa (Keyword Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'greeting');
      const chips = await page.$$('.keyword-chip');
      assert.ok(chips.length >= 7);
    });

    it('[UI-KEYWRD-03] Kiểm thử tìm kiếm nhóm từ khóa (Search Keyword UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'greeting');
      await setInputValue(page, '.search-input-wrapper input', 'farewell');
      await sleep(150);
      const text = await getBodyText(page);
      assert.ok(text.includes('farewell'));
      assert.ok(!text.includes('good morning'));
    });

    it('[UI-KEYWRD-04] Kiểm thử làm mới dữ liệu từ khóa (Refresh Action)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'Làm mới');
      const beforeCount = state.requests.filter((r) => r.pathname === '/admin/keywords').length;
      await clickByText(page, 'button', 'Làm mới');
      await sleep(150);
      const afterCount = state.requests.filter((r) => r.pathname === '/admin/keywords').length;
      assert.ok(afterCount > beforeCount);
    });

    it('[UI-KEYWRD-05] Kiểm thử xuất dữ liệu CSV (Export CSV Action)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'Xuất file CSV');
      await page.click('.btn-download-csv');
      await sleep(150);
      assert.ok(state.requests.some((r) => r.pathname === '/admin/keywords/download'));
    });

    it('[UI-KEYWRD-06] Kiểm thử Modal thêm nhóm từ khóa (Create Keyword Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'Thêm nhóm từ khóa');
      await page.click('.add-course-btn');
      await sleep(100);
      const modalTitle = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(modalTitle, 'Thêm nhóm từ khóa mới');
    });

    it('[UI-KEYWRD-07] Kiểm thử kiểm tra tính hợp lệ dữ liệu nhóm từ khóa (Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/keywords');
      await page.click('.add-course-btn');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/keywords').length, 0);
    });

    it('[UI-KEYWRD-08] Kiểm thử chức năng chuẩn (Happy Path Create Keyword Group)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'technology');
      await setInputValue(page, '.modal-content textarea', 'software, hardware, coding, artificial intelligence');
      await page.click('.modal-content .btn-submit');
      await waitForText(page, 'technology');
      const text = await getBodyText(page);
      assert.ok(text.includes('technology'));
      assert.ok(text.includes('artificial intelligence'));
    });

    it('[UI-KEYWRD-09] Kiểm thử chỉnh sửa nhóm từ khóa (Edit Keyword Group Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'greeting');
      await page.click('.course-table .btn-edit');
      await sleep(100);
      await setInputValue(page, '.modal-content textarea', 'hello, hi, howdy');
      await page.click('.modal-content .btn-submit');
      await waitForText(page, 'howdy');
      const text = await getBodyText(page);
      assert.ok(text.includes('howdy'));
    });

    it('[UI-KEYWRD-10] Kiểm thử xóa nhóm từ khóa (Delete Keyword Group Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/keywords');
      await waitForText(page, 'greeting');
      await page.click('.course-table .btn-delete');
      await clickConfirmModal(page, 'confirm');
      await sleep(250);
      const rows = await page.$$('.course-table tbody tr');
      assert.equal(rows.length, 1);
    });
  });
});
