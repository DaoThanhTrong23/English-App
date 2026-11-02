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
  createExcelTempFile,
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 04: Vocabulary Bank & Add Word (UI-WORD, UI-WRDADD)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 9: UI-WORD-01 .. UI-WORD-15
  // =========================================================================
  describe('9. Ngân hàng Từ vựng (/admin/words)', () => {
    it('[UI-WORD-01] Kiểm thử hiển thị bảng ngân hàng từ vựng (Word Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      const headers = await page.$$eval('.word-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(headers.some((h) => h.includes('Từ vựng')));
      assert.ok(headers.some((h) => h.includes('Loại từ')));
      assert.ok(headers.some((h) => h.includes('Cấp độ')));
      assert.ok(headers.some((h) => h.includes('Nghĩa')));
      assert.ok(headers.some((h) => h.includes('Hình ảnh')));
    });

    it('[UI-WORD-02] Kiểm thử tìm kiếm từ gốc (Search by English Headword)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await setInputValue(page, '.word-search-input', 'sustainable');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('sustainable'));
      assert.ok(!text.includes('negotiate'));
    });

    it('[UI-WORD-03] Kiểm thử tìm kiếm nghĩa tiếng Việt (Search by Vietnamese Meaning)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await setInputValue(page, '.word-search-input', 'đàm phán');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('negotiate'));
      assert.ok(!text.includes('sustainable'));
    });

    it('[UI-WORD-04] Kiểm thử lọc theo CEFR (Filter by CEFR Level)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.evaluate(() => {
        const selects = document.querySelectorAll('.word-filter-row-bottom .filter-select') as NodeListOf<HTMLSelectElement>;
        selects[0].value = 'C1';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('sustainable'));
      assert.ok(!text.includes('hello'));
    });

    it('[UI-WORD-05] Kiểm thử lọc theo loại từ (Filter by Part of Speech)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.evaluate(() => {
        const selects = document.querySelectorAll('.word-filter-row-bottom .filter-select') as NodeListOf<HTMLSelectElement>;
        selects[1].value = 'verb';
        selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('negotiate'));
      assert.ok(!text.includes('hello'));
    });

    it('[UI-WORD-06] Kiểm thử lọc theo phương tiện đa phương tiện (Filter by Media)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.evaluate(() => {
        const selects = document.querySelectorAll('.word-filter-row-bottom .filter-select') as NodeListOf<HTMLSelectElement>;
        selects[2].value = 'yes';
        selects[2].dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('hello'));
      assert.ok(!text.includes('negotiate'));
    });

    it('[UI-WORD-07] Kiểm thử lọc theo âm thanh (Filter by Audio)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.evaluate(() => {
        const selects = document.querySelectorAll('.word-filter-row-bottom .filter-select') as NodeListOf<HTMLSelectElement>;
        selects[3].value = 'no';
        selects[3].dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('negotiate'));
      assert.ok(!text.includes('hello'));
    });

    it('[UI-WORD-08] Kiểm thử đặt lại bộ lọc (Reset Filter UI Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await setInputValue(page, '.word-search-input', 'sustainable');
      await sleep(400);
      assert.ok(await page.$('.filter-reset-btn'));
      await page.click('.filter-reset-btn');
      await sleep(400);
      const text = await getBodyText(page);
      assert.ok(text.includes('hello'));
      assert.ok(text.includes('negotiate'));
    });

    it('[UI-WORD-09] Kiểm thử phát âm thanh trực tiếp (Audio Playback UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('.edit-btn');
      await sleep(150);
      const audioEl = await page.$('.modal-content audio');
      assert.ok(audioEl);
      const src = await page.$eval('.modal-content audio', (el) => (el as HTMLAudioElement).src);
      assert.ok(src.includes('.mp3'));
    });

    it('[UI-WORD-10] Kiểm thử sắp xếp từ điển (Alphabetical Sort UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('th[title="Sắp xếp theo từ vựng"]');
      await sleep(400);
      await page.click('th[title="Sắp xếp theo từ vựng"]');
      await sleep(400);
      const firstWord = await page.$eval('.word-table tbody tr:first-child strong', (el) => el.textContent || '');
      assert.equal(firstWord, 'sustainable');
    });

    it('[UI-WORD-11] Kiểm thử phân trang máy chủ (Server-side Pagination UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'Hiển thị 4 / 4 từ vựng');
      const stats = await page.$eval('.word-filter-stats', (el) => el.textContent || '');
      assert.ok(stats.includes('4'));
      assert.ok(await page.$('.pagination'));
    });

    it('[UI-WORD-12] Kiểm thử giao diện Modal sửa từ vựng (Edit Word Modal)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('.edit-btn');
      await sleep(150);
      const modalHead = await page.$eval('.modal-content h3', (el) => el.textContent || '');
      const headwordVal = await page.$eval('.modal-content input[name="headword"]', (el) => (el as HTMLInputElement).value);
      assert.equal(modalHead, 'Sửa từ vựng');
      assert.equal(headwordVal, 'hello');
    });

    it('[UI-WORD-13] Kiểm thử tích hợp gợi ý ảnh trực tuyến (Online Image Suggestions UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('.edit-btn');
      await sleep(100);
      await clickByText(page, '.modal-content button', 'Tự động điền dữ liệu thiếu');
      await waitForText(page, 'Chọn hình ảnh mới');
      const imgCount = (await page.$$('.modal-content .image-options img')).length;
      assert.ok(imgCount >= 2);
    });

    it('[UI-WORD-14] Kiểm thử lưu cập nhật từ vựng (Update Word Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('.edit-btn');
      await sleep(100);
      await setInputValue(page, '.modal-content textarea[name="meaning"]', 'xin chào (đã cập nhật)');
      await page.click('.modal-content .save-btn');
      await waitForText(page, 'xin chào (đã cập nhật)');
      const text = await getBodyText(page);
      assert.ok(text.includes('xin chào (đã cập nhật)'));
    });

    it('[UI-WORD-15] Kiểm thử xóa và khôi phục từ vựng (Delete & Restore Word Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      await waitForText(page, 'hello');
      await page.click('.word-table .delete-btn');
      await clickConfirmModal(page, 'confirm');
      await sleep(300);
      const restoreBtnsAfterDel = await page.$$('.word-table .btn-restore');
      assert.equal(restoreBtnsAfterDel.length, 2);
      await page.click('.word-table .btn-restore');
      await sleep(300);
      const restoreBtnsAfterRestore = await page.$$('.word-table .btn-restore');
      assert.equal(restoreBtnsAfterRestore.length, 1);
    });
  });

  // =========================================================================
  // GROUP 10: UI-WRDADD-01 .. UI-WRDADD-13
  // =========================================================================
  describe('10. Thêm Từ vựng Mới & Nhập Excel (/admin/words/add)', () => {
    it('[UI-WRDADD-01] Kiểm thử bố cục 2 Tab Thêm từ vựng (Add Word Layout UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng mới');
      const tabs = await page.$$eval('.add-word-tabs .tab-btn', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.ok(tabs.some((t) => t.includes('Nhập thủ công')));
      assert.ok(tabs.some((t) => t.includes('Nhập từ file')));
    });

    it('[UI-WRDADD-02] Kiểm thử tính năng tra cứu từ điển tự động (Auto Dictionary Lookup)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Thêm từ vựng mới');
      await setInputValue(page, 'input[placeholder="Nhập từ khóa tiếng Anh"]', 'apple');
      await page.click('button.search-btn');
      await waitForText(page, 'Chọn hình ảnh minh họa');
      const headword = await page.$eval('input[name="headword"]', (el) => (el as HTMLInputElement).value);
      const phonetic = await page.$eval('input[name="phonetic"]', (el) => (el as HTMLInputElement).value);
      assert.equal(headword, 'apple');
      assert.ok(phonetic.includes('/apple/'));
    });

    it('[UI-WRDADD-03] Kiểm thử lưới chọn ảnh trực quan (Image Selection Grid UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await setInputValue(page, 'input[placeholder="Nhập từ khóa tiếng Anh"]', 'apple');
      await page.click('button.search-btn');
      await waitForText(page, 'Chọn hình ảnh minh họa');
      const wrappers = await page.$$('.image-options .image-wrapper');
      assert.ok(wrappers.length > 0);
      await wrappers[0].click();
      await sleep(100);
      const isSelected = await page.$('.image-options .image-wrapper.selected');
      assert.ok(isSelected);
    });

    it('[UI-WRDADD-04] Kiểm thử phát âm mẫu trong form (Audio Preview UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await setInputValue(page, 'input[placeholder="Nhập từ khóa tiếng Anh"]', 'apple');
      await page.click('button.search-btn');
      await waitForText(page, 'Phát Âm');
      const audioEl = await page.$('.audio-preview audio');
      assert.ok(audioEl);
    });

    it('[UI-WRDADD-05] Kiểm thử ràng buộc trường bắt buộc (Required Fields Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Lưu từ vựng');
      await page.click('button.save-btn');
      await waitForText(page, 'Vui lòng nhập đầy đủ từ vựng');
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/word').length, 0);
    });

    it('[UI-WRDADD-06] Kiểm thử ràng buộc trùng lặp dữ liệu (Duplicate Word Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await setInputValue(page, 'input[name="headword"]', 'hello');
      await page.evaluate(() => {
        const sel = document.querySelector('select[name="partOfSpeech"]') as HTMLSelectElement;
        sel.value = 'noun';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setInputValue(page, 'textarea[name="meaning"]', 'xin chào');
      await page.click('button.save-btn');
      await waitForText(page, 'đã tồn tại');
      const text = await getBodyText(page);
      assert.ok(text.includes('đã tồn tại'));
    });

    it('[UI-WRDADD-07] Kiểm thử chức năng chuẩn (Happy Path Create Word Manual)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await setInputValue(page, 'input[name="headword"]', 'brilliant');
      await page.evaluate(() => {
        const sel = document.querySelector('select[name="partOfSpeech"]') as HTMLSelectElement;
        sel.value = 'adjective';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await setInputValue(page, 'textarea[name="meaning"]', 'xuất sắc, tài giỏi');
      await page.click('button.save-btn');
      await waitForText(page, 'brilliant');
      assert.ok(page.url().endsWith('/admin/words'));
    });

    it('[UI-WRDADD-08] Kiểm thử khu vực tải tệp Excel (Drag and Drop Zone UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await waitForText(page, 'Kéo thả tập tin vào đây');
      assert.ok(await page.$('.upload-area'));
      assert.ok(await page.$('.browse-btn'));
    });

    it('[UI-WRDADD-09] Kiểm thử tải tệp mẫu Excel (Download Sample Excel Template)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      await waitForText(page, 'Tải file mẫu (.xlsx)');
      const btn = await page.$('.download-template-btn');
      assert.ok(btn);
      await btn.click();
      await sleep(100);
    });

    it('[UI-WRDADD-10] Kiểm thử kiểm tra định dạng tệp (File Format Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      const emptyFile = createTempFile('empty.txt', '');
      const input = await page.$('input.file-input');
      assert.ok(input);
      await input.uploadFile(emptyFile);
      await sleep(200);
      const text = await getBodyText(page);
      assert.ok(text.includes('Tập tin không chứa dòng dữ liệu nào') || text.includes('Không tìm thấy từ vựng hợp lệ'));
    });

    it('[UI-WRDADD-11] Kiểm thử phân tích và xem trước dữ liệu Excel (Excel Data Preview UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      const xlsxPath = createExcelTempFile('words-valid.xlsx', [
        { headword: 'harmony', partOfSpeech: 'noun', cefrLevel: 'B2', phonetic: '/ˈhɑː.mə.ni/', meaning: 'sự hài hòa', exampleSentence: 'Live in harmony.' },
        { headword: 'inspire', partOfSpeech: 'verb', cefrLevel: 'B2', phonetic: '/ɪnˈspaɪər/', meaning: 'truyền cảm hứng', exampleSentence: 'She inspired us.' },
      ]);
      const input = await page.$('input.file-input');
      assert.ok(input);
      await input.uploadFile(xlsxPath);
      await waitForText(page, 'Xem trước dữ liệu (2 từ vựng sẵn sàng thêm)');
      const text = await getBodyText(page);
      assert.ok(text.includes('harmony'));
      assert.ok(text.includes('inspire'));
    });

    it('[UI-WRDADD-12] Kiểm thử nhập hàng loạt từ Excel (Batch Import Execution)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await clickByText(page, '.tab-btn', 'Nhập từ file');
      const xlsxPath = createExcelTempFile('words-import.xlsx', [
        { headword: 'resilient', partOfSpeech: 'adjective', cefrLevel: 'C1', phonetic: '/rɪˈzɪl.i.ənt/', meaning: 'kiên cường', exampleSentence: 'Be resilient.' },
      ]);
      const input = await page.$('input.file-input');
      assert.ok(input);
      await input.uploadFile(xlsxPath);
      await waitForText(page, 'Xem trước dữ liệu (1 từ vựng sẵn sàng thêm)');
      await page.click('button.upload-btn');
      await sleep(300);
      assert.ok(page.url().endsWith('/admin/words'));
    });

    it('[UI-WRDADD-13] Kiểm thử điều hướng quay lại (Back Navigation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words/add');
      await waitForText(page, 'Quay lại');
      await page.click('button.back-btn');
      await sleep(150);
      assert.ok(page.url().endsWith('/admin/words'));
    });
  });
});
