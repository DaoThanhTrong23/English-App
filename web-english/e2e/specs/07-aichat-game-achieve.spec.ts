import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Page } from 'puppeteer-core';
import {
  initHarness,
  resetState,
  loginAndGoto,
  setInputValue,
  clickByText,
  waitForText,
  getBodyText,
  clickConfirmModal,
  createTempFile,
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 07: AI Chat, Mini-Games & Achievements (UI-AICHAT, UI-GAME, UI-ACHIEVE)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 17: UI-AICHAT-01 .. UI-AICHAT-08
  // =========================================================================
  describe('17. Giám sát Hội thoại AI Chat (/admin/ai-chat)', () => {
    it('[UI-AICHAT-01] Kiểm thử thẻ thống kê hội thoại AI (AI Chat Stats Cards UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, '1820');
      const cards = await page.$$('.ai-stat-card');
      assert.equal(cards.length, 4);
      const text = await getBodyText(page);
      assert.ok(text.includes('145'));
      assert.ok(text.includes('1820'));
      assert.ok(text.includes('68'));
    });

    it('[UI-AICHAT-02] Kiểm thử làm mới dữ liệu AI (Refresh AI Stats & Sessions)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, '1820');
      const beforeCount = state.requests.filter((r) => r.pathname === '/ai/admin/sessions').length;
      await page.click('.ai-refresh-btn');
      await sleep(250);
      const afterCount = state.requests.filter((r) => r.pathname === '/ai/admin/sessions').length;
      assert.ok(afterCount > beforeCount);
    });

    it('[UI-AICHAT-03] Kiểm thử tìm kiếm phiên chat (Search AI Session UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      await setInputValue(page, '.sidebar-search-box input', 'HoangNam');
      await sleep(450);
      const items = await page.$$('.session-card-item');
      assert.equal(items.length, 1);
      const text = await page.$eval('.session-card-item', (el) => el.textContent || '');
      assert.ok(text.includes('HoangNam'));
    });

    it('[UI-AICHAT-04] Kiểm thử danh sách các phiên chat (Session List Item UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      const items = await page.$$('.session-card-item');
      assert.equal(items.length, 2);
      const cardText = await page.$eval('.session-card-item', (el) => el.textContent || '');
      assert.ok(cardText.includes('Luyện phỏng vấn xin việc bằng tiếng Anh'));
      assert.ok(cardText.includes('3 tin nhắn'));
    });

    it('[UI-AICHAT-05] Kiểm thử xem chi tiết tin nhắn hội thoại (Chat Messages Panel UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      await page.click('.session-card-item');
      await waitForText(page, 'Can you help me practice for a job interview?');
      const bubbles = await page.$$('.message-bubble-row');
      assert.equal(bubbles.length, 3);
    });

    it('[UI-AICHAT-06] Kiểm thử lọc tin nhắn theo người gửi (Role Filter Buttons UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      await page.click('.session-card-item');
      await waitForText(page, 'Can you help me practice for a job interview?');
      await clickByText(page, '.filter-pill', 'Gà Con AI');
      await sleep(100);
      const aiBubbles = await page.$$('.message-bubble-row');
      assert.equal(aiBubbles.length, 1);
      await clickByText(page, '.filter-pill', 'Học viên');
      await sleep(100);
      const userBubbles = await page.$$('.message-bubble-row');
      assert.equal(userBubbles.length, 2);
    });

    it('[UI-AICHAT-07] Kiểm thử tìm kiếm nội dung tin nhắn (In-chat Search UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      await page.click('.session-card-item');
      await waitForText(page, 'Can you help me practice for a job interview?');
      await setInputValue(page, '.in-chat-search input', 'experience');
      await sleep(100);
      const bubbles = await page.$$('.message-bubble-row');
      assert.equal(bubbles.length, 1);
    });

    it('[UI-AICHAT-08] Kiểm thử xóa phiên hội thoại AI (Delete AI Chat Session Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/ai-chat');
      await waitForText(page, 'MinhAnh99');
      await page.click('.delete-session-btn');
      await clickConfirmModal(page, 'confirm');
      await sleep(250);
      const items = await page.$$('.session-card-item');
      assert.equal(items.length, 1);
    });
  });

  // =========================================================================
  // GROUP 18: UI-GAME-01 .. UI-GAME-09
  // =========================================================================
  describe('18. Cấu hình Trò chơi Ôn tập (/admin/game & /admin/game-stats)', () => {
    it('[UI-GAME-01] Kiểm thử thanh Tab 4 Mini-games (Game Tabs UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'Cấu hình Trò chơi Ôn tập');
      const text = await getBodyText(page);
      assert.ok(text.includes('Bắn bóng từ vựng'));
      assert.ok(text.includes('Lật thẻ trí nhớ'));
      assert.ok(text.includes('Nối từ siêu tốc'));
      assert.ok(text.includes('Mario giải cứu từ vựng'));
    });

    it('[UI-GAME-02] Kiểm thử chuyển đổi tab trò chơi (Game Tab Switching)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'Bắn bóng từ vựng');
      await clickByText(page, 'button', 'Lật thẻ trí nhớ');
      await waitForText(page, 'MEMORY');
      const text = await getBodyText(page);
      assert.ok(text.includes('MEMORY'));
      assert.ok(text.includes('Số cặp thẻ (1 cặp = 2 thẻ)'));
    });

    it('[UI-GAME-03] Kiểm thử thẻ hướng dẫn sư phạm (Game Tip Banner UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'Mục tiêu & Cách chơi:');
      const text = await getBodyText(page);
      assert.ok(text.includes('Mục tiêu & Cách chơi:'));
      assert.ok(text.includes('Bóng bay từ vựng rèn luyện phản xạ nhanh'));
    });

    it('[UI-GAME-04] Kiểm thử bố cục 3 cấp độ khó (3 Difficulty Cards UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'EASY');
      const text = await getBodyText(page);
      assert.ok(text.includes('EASY'));
      assert.ok(text.includes('NORMAL'));
      assert.ok(text.includes('HARD'));
      const inputs = await page.$$('input[type="number"]');
      assert.equal(inputs.length, 12);
    });

    it('[UI-GAME-05] Kiểm thử chỉnh sửa thông số game (Edit Game Settings UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'EASY');
      await setInputValue(page, 'input[type="number"]', '12');
      const val = await page.$eval('input[type="number"]', (el) => (el as HTMLInputElement).value);
      assert.equal(val, '12');
    });

    it('[UI-GAME-06] Kiểm thử hiển thị đặc thù game (Game-specific Constraint UI - MATCHING)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'Nối từ siêu tốc');
      await clickByText(page, 'button', 'Nối từ siêu tốc');
      await waitForText(page, 'Điểm trừ (Không áp dụng)');
      const disabledInputs = await page.$$('input[type="number"]:disabled');
      assert.equal(disabledInputs.length, 3);
    });

    it('[UI-GAME-07] Kiểm thử kiểm tra tính hợp lệ dữ liệu cấu hình game (Form Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'EASY');
      const minAttr = await page.$eval('input[type="number"]', (el) => el.getAttribute('min'));
      assert.equal(minAttr, '1');
    });

    it('[UI-GAME-08] Kiểm thử lưu cấu hình trò chơi (Save Game Settings Action)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/game');
      await waitForText(page, 'EASY');
      await clickByText(page, 'button', 'Lưu cấu hình');
      await waitForText(page, 'Cập nhật cấu hình Game thành công');
      assert.ok(state.requests.some((r) => r.method === 'PUT' && r.pathname === '/games/admin/1/settings'));
    });

    it('[UI-GAME-09] Kiểm thử bảng xếp hạng kỷ lục game (Game Leaderboard UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await waitForText(page, 'MinhAnh99');
      const text = await getBodyText(page);
      assert.ok(text.includes('MinhAnh99'));
      assert.ok(text.includes('15,400') || text.includes('15.400') || text.includes('15400'));
    });
  });

  // =========================================================================
  // GROUP 19: UI-ACHIEVE-01 .. UI-ACHIEVE-08
  // =========================================================================
  describe('19. Quản lý Thành tựu & Huy hiệu (/admin/achievements)', () => {
    it('[UI-ACHIEVE-01] Kiểm thử hiển thị danh hiệu (Achievement List UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Tân Binh Chăm Chỉ');
      const headers = await page.$$eval('.course-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.includes('Tên danh hiệu'));
      assert.ok(headers.includes('Yêu cầu XP'));
      assert.ok(headers.includes('Yêu cầu Streak (Ngày)'));
    });

    it('[UI-ACHIEVE-02] Kiểm thử Modal tạo danh hiệu (Create Achievement Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Thêm danh hiệu');
      await page.click('.add-course-btn');
      await sleep(100);
      const modalTitle = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      assert.equal(modalTitle, 'Thêm danh hiệu mới');
    });

    it('[UI-ACHIEVE-03] Kiểm thử tải ảnh icon huy hiệu (Achievement Icon Upload UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await page.click('.add-course-btn');
      await sleep(100);
      const iconPath = createTempFile('badge.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
      const fileInput = await page.$('.modal-content input[type="file"]');
      assert.ok(fileInput);
      await (fileInput as any).uploadFile(iconPath);
      await waitForText(page, 'Tải ảnh biểu tượng thành công');
      assert.ok(await page.$('.modal-content img[alt="Preview"]'));
    });

    it('[UI-ACHIEVE-04] Kiểm thử nhập điều kiện XP và Streak (Condition Fields UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await page.click('.add-course-btn');
      await sleep(100);
      const numInputs = await page.$$('.modal-content input[type="number"]');
      assert.equal(numInputs.length, 2);
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('.modal-content input[type="number"]') as NodeListOf<HTMLInputElement>;
        inputs[0].value = '2000';
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        inputs[1].value = '14';
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      });
      const vals = await page.$$eval('.modal-content input[type="number"]', (els) => els.map((e) => (e as HTMLInputElement).value));
      assert.deepEqual(vals, ['2000', '14']);
    });

    it('[UI-ACHIEVE-05] Kiểm thử kiểm tra tính hợp lệ danh hiệu (Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/achievements');
      await page.click('.add-course-btn');
      await sleep(100);
      const isValid = await page.$eval('.modal-content form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/achievements').length, 0);
    });

    it('[UI-ACHIEVE-06] Kiểm thử chức năng chuẩn (Happy Path Create Achievement)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await page.click('.add-course-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Chiến Thần Từ Vựng');
      await setInputValue(page, '.modal-content textarea', 'Hoàn thành 1000 từ vựng');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Chiến Thần Từ Vựng');
      const text = await getBodyText(page);
      assert.ok(text.includes('Chiến Thần Từ Vựng'));
    });

    it('[UI-ACHIEVE-07] Kiểm thử cập nhật danh hiệu (Edit Achievement Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Tân Binh Chăm Chỉ');
      await page.click('.course-table .btn-edit');
      await sleep(100);
      await setInputValue(page, '.modal-content input[type="text"]', 'Tân Binh Xuất Sắc');
      await page.click('.modal-content .submit-btn');
      await waitForText(page, 'Tân Binh Xuất Sắc');
      const text = await getBodyText(page);
      assert.ok(text.includes('Tân Binh Xuất Sắc'));
    });

    it('[UI-ACHIEVE-08] Kiểm thử xóa danh hiệu (Delete Achievement Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/achievements');
      await waitForText(page, 'Tân Binh Chăm Chỉ');
      await page.click('.course-table .btn-delete');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Đã xóa danh hiệu thành công');
      const rows = await page.$$('.course-table tbody tr');
      assert.equal(rows.length, 1);
    });
  });
});
