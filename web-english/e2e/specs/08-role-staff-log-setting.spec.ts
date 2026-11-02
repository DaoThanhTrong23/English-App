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

describe('Suite 08: RBAC Roles, Staff, System Logs & Settings (UI-ROLE, UI-STAFF, UI-LOG, UI-SETTING)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 20: UI-ROLE-01 .. UI-ROLE-10
  // =========================================================================
  describe('20. Phân quyền & Vai trò RBAC (/admin/roles)', () => {
    it('[UI-ROLE-01] Kiểm thử hiển thị danh sách vai trò RBAC (Role List UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      const cards = await page.$$('.role-card');
      assert.equal(cards.length, 3);
      assert.ok(await page.$('.badge-system'));
      assert.ok(await page.$('.badge-custom'));
    });

    it('[UI-ROLE-02] Kiểm thử tìm kiếm vai trò (Search Role UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      await setInputValue(page, '.role-search-box input', 'ContentEditor');
      await sleep(100);
      const cards = await page.$$('.role-card');
      assert.equal(cards.length, 1);
    });

    it('[UI-ROLE-03] Kiểm thử Modal xem chi tiết quyền hạn (View Role Permissions Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      await page.click('.role-card .role-btn-view');
      await waitForText(page, 'Danh sách quyền hạn của vai trò');
      assert.ok(await page.$('.view-perm-grid'));
      await clickByText(page, '.role-modal-footer button', 'Đóng');
      await sleep(100);
    });

    it('[UI-ROLE-04] Kiểm thử Modal tạo vai trò tùy chỉnh (Create Custom Role Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      await clickByText(page, 'button', 'Thêm vai trò mới');
      await waitForText(page, 'Tạo vai trò tùy chỉnh mới');
      assert.ok(await page.$('.role-form-input'));
      assert.ok(await page.$('.permissions-module-group'));
    });

    it('[UI-ROLE-05] Kiểm thử chọn nhanh quyền hạn theo module (Select/Deselect All Permissions)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      await clickByText(page, 'button', 'Thêm vai trò mới');
      await waitForText(page, 'Chọn tất cả');
      await page.waitForSelector('.permission-checkbox-item', { timeout: 3000 });
      await clickByText(page, '.permissions-action-btn', 'Chọn tất cả');
      await sleep(150);
      const checkedCount = (await page.$$('.permission-checkbox-item.checked')).length;
      assert.ok(checkedCount > 10);
      await clickByText(page, '.permissions-action-btn', 'Bỏ chọn tất cả');
      await sleep(150);
      const afterClearCount = (await page.$$('.permission-checkbox-item.checked')).length;
      assert.equal(afterClearCount, 0);
    });

    it('[UI-ROLE-06] Kiểm thử kiểm tra tính hợp lệ dữ liệu vai trò (Role Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/roles');
      await clickByText(page, 'button', 'Thêm vai trò mới');
      await sleep(100);
      const isValid = await page.$eval('.role-modal-container form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/roles').length, 0);
    });

    it('[UI-ROLE-07] Kiểm thử chức năng chuẩn (Happy Path Create Custom Role)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await clickByText(page, 'button', 'Thêm vai trò mới');
      await sleep(100);
      await setInputValue(page, '.role-form-input', 'ReviewerQA');
      await setInputValue(page, '.role-form-textarea', 'Kiểm duyệt viên chất lượng đề thi');
      await clickByText(page, '.permissions-action-btn', 'Chọn tất cả');
      await page.click('.modal-btn-submit');
      await waitForText(page, 'ReviewerQA');
      const text = await getBodyText(page);
      assert.ok(text.includes('ReviewerQA'));
    });

    it('[UI-ROLE-08] Kiểm thử cập nhật vai trò tùy chỉnh (Edit Custom Role Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      const editBtns = await page.$$('.role-btn-edit:not(:disabled)');
      assert.equal(editBtns.length, 1);
      await editBtns[0].click();
      await waitForText(page, 'Chỉnh sửa vai trò: ContentEditor');
      await setInputValue(page, '.role-form-textarea', 'Mô tả đã cập nhật cho ContentEditor');
      await page.click('.modal-btn-submit');
      await sleep(350);
      await waitForText(page, 'Mô tả đã cập nhật cho ContentEditor');
      const text = await getBodyText(page);
      assert.ok(text.includes('Mô tả đã cập nhật cho ContentEditor'));
    });

    it('[UI-ROLE-09] Kiểm thử bảo vệ vai trò hệ thống (System Role Protection UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      const disabledEditCount = (await page.$$('.role-btn-edit:disabled')).length;
      const disabledDelCount = (await page.$$('.role-btn-delete:disabled')).length;
      assert.equal(disabledEditCount, 2);
      assert.equal(disabledDelCount, 2);
    });

    it('[UI-ROLE-10] Kiểm thử xóa vai trò tùy chỉnh (Delete Custom Role Action)', async () => {
      const state = resetState();
      state.roles = state.roles.map((r) => (r.id === 3 ? { ...r, userCount: 0 } : r));
      await loginAndGoto(page, '/admin/roles');
      await waitForText(page, 'ContentEditor');
      const delBtns = await page.$$('.role-btn-delete:not(:disabled)');
      assert.equal(delBtns.length, 1);
      await delBtns[0].click();
      await clickConfirmModal(page, 'confirm');
      await sleep(250);
      const cards = await page.$$('.role-card');
      assert.equal(cards.length, 2);
    });
  });

  // =========================================================================
  // GROUP 21: UI-STAFF-01 .. UI-STAFF-12
  // =========================================================================
  describe('21. Quản lý Tài khoản Nhân sự & Admin (/admin/staff)', () => {
    it('[UI-STAFF-01] Kiểm thử hiển thị danh sách nhân sự (Staff Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'EditorHung');
      const rows = await page.$$('.staff-table tbody tr');
      assert.equal(rows.length, 3);
      const text = await getBodyText(page);
      assert.ok(text.includes('SuperAdmin'));
      assert.ok(text.includes('SecondAdmin'));
      assert.ok(text.includes('EditorHung'));
    });

    it('[UI-STAFF-02] Kiểm thử tìm kiếm nhân sự (Search Staff UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'EditorHung');
      await setInputValue(page, '.staff-search-input', 'EditorHung');
      await sleep(450);
      const rows = await page.$$('.staff-table tbody tr');
      assert.equal(rows.length, 1);
    });

    it('[UI-STAFF-03] Kiểm thử Modal tạo nhân viên (Create Staff Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'Thêm nhân viên mới');
      await clickByText(page, 'button', 'Thêm nhân viên mới');
      await waitForText(page, 'Tạo tài khoản nhân viên/quản trị viên mới');
      assert.ok(await page.$('.staff-modal'));
    });

    it('[UI-STAFF-04] Kiểm thử kiểm tra tính hợp lệ dữ liệu nhân sự (Staff Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/staff');
      await clickByText(page, 'button', 'Thêm nhân viên mới');
      await sleep(100);
      await setInputValue(page, '.staff-modal input[type="text"]', 'weak_staff');
      await setInputValue(page, '.staff-modal input[type="email"]', 'weak@english.com');
      await setInputValue(page, '.staff-modal input[type="password"]', '123456');
      await clickByText(page, '.staff-modal button', 'Tạo tài khoản');
      await waitForText(page, 'Mật khẩu phải có trên 8 ký tự');
      assert.equal(state.requests.filter((r) => r.method === 'POST' && r.pathname === '/admin/staff').length, 0);
    });

    it('[UI-STAFF-05] Kiểm thử chức năng chuẩn (Happy Path Create Staff)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await clickByText(page, 'button', 'Thêm nhân viên mới');
      await sleep(100);
      await setInputValue(page, '.staff-modal input[placeholder*="staff_marketing"]', 'staff_linh');
      await setInputValue(page, '.staff-modal input[type="email"]', 'linh.staff@english.com');
      await setInputValue(page, '.staff-modal input[type="password"]', 'StrongPass@2026');
      await clickByText(page, '.staff-modal button', 'Tạo tài khoản');
      await waitForText(page, 'staff_linh');
      const text = await getBodyText(page);
      assert.ok(text.includes('staff_linh'));
    });

    it('[UI-STAFF-06] Kiểm thử Modal thăng hạng tài khoản học viên (Promote Student Modal UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'Nâng cấp từ học viên');
      await clickByText(page, 'button', 'Nâng cấp từ học viên');
      await waitForText(page, 'Nâng cấp tài khoản học viên lên Nhân viên / Admin');
      await setInputValue(page, '.staff-modal input[type="text"]', 'MinhAnh');
      await waitForText(page, 'minhanh@gmail.com');
      assert.ok(await page.$('.candidate-item'));
    });

    it('[UI-STAFF-07] Kiểm thử nâng cấp vai trò học viên (Promote Student Execution)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await clickByText(page, 'button', 'Nâng cấp từ học viên');
      await sleep(100);
      await setInputValue(page, '.staff-modal input[type="text"]', 'MinhAnh');
      await waitForText(page, 'minhanh@gmail.com');
      await page.click('.candidate-item');
      await sleep(100);
      await clickByText(page, '.staff-modal button', 'Xác nhận nâng cấp');
      await waitForText(page, 'MinhAnh99');
      const rows = await page.$$('.staff-table tbody tr');
      assert.equal(rows.length, 4);
    });

    it('[UI-STAFF-08] Kiểm thử nâng cấp nhanh Admin (Quick Promote to Admin Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'EditorHung');
      await page.click('.action-btn.promote');
      await clickConfirmModal(page, 'confirm');
      await sleep(250);
      const promoteBtns = await page.$$('.action-btn.promote');
      assert.equal(promoteBtns.length, 0);
    });

    it('[UI-STAFF-09] Kiểm thử chỉnh sửa thông tin nhân viên (Edit Staff Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'EditorHung');
      const editBtns = await page.$$('.action-btn.edit:not(:disabled)');
      await editBtns[editBtns.length - 1].click();
      await waitForText(page, 'Chỉnh sửa nhân viên: EditorHung');
      await setInputValue(page, '.staff-modal input[placeholder*="Quản lý nội dung"]', 'Trưởng nhóm Biên tập');
      await clickByText(page, '.staff-modal button', 'Lưu thay đổi');
      await waitForText(page, 'Cập nhật thông tin nhân viên');
    });

    it('[UI-STAFF-10] Kiểm thử bảo vệ quyền riêng tư Quản trị viên (Admin Protection UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'SecondAdmin');
      const disabledEdit = await page.$('button.action-btn.edit:disabled');
      assert.ok(disabledEdit);
    });

    it('[UI-STAFF-11] Kiểm thử chống tự xóa tài khoản Admin (Self-deletion Prevention UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'Chính bạn');
      const disabledDeletes = await page.$$('button.action-btn.delete:disabled');
      assert.equal(disabledDeletes.length, 2);
    });

    it('[UI-STAFF-12] Kiểm thử xóa tài khoản nhân viên (Delete Staff Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/staff');
      await waitForText(page, 'EditorHung');
      const activeDel = await page.$('button.action-btn.delete:not(:disabled)');
      assert.ok(activeDel);
      await activeDel.click();
      await clickConfirmModal(page, 'confirm');
      await sleep(250);
      const rows = await page.$$('.staff-table tbody tr');
      assert.equal(rows.length, 2);
    });
  });

  // =========================================================================
  // GROUP 22: UI-LOG-01 .. UI-LOG-07
  // =========================================================================
  describe('22. Nhật ký Hệ thống (/admin/logs)', () => {
    it('[UI-LOG-01] Kiểm thử giao diện Tab nhật ký hệ thống (System Logs Tabs UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Nhật ký hệ thống');
      const text = await getBodyText(page);
      assert.ok(text.includes('Hoạt động'));
      assert.ok(text.includes('Đăng nhập'));
    });

    it('[UI-LOG-02] Kiểm thử hiển thị bảng nhật ký hoạt động (Activity Log Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Tạo chủ đề mới: Daily Conversations');
      const headers = await page.$$eval('.course-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.deepEqual(headers, ['Thời gian', 'Người dùng', 'Hành động', 'Chi tiết']);
    });

    it('[UI-LOG-03] Kiểm thử bảng nhật ký đăng nhập (Login Logs Table UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Nhật ký hệ thống');
      await clickByText(page, 'button', 'Đăng nhập');
      await waitForText(page, 'Chrome 132 on macOS');
      const headers = await page.$$eval('.course-table th', (els) => els.map((e) => (e.textContent || '').trim()));
      assert.deepEqual(headers, ['Thời gian', 'Người dùng', 'Địa chỉ IP', 'Thiết bị']);
    });

    it('[UI-LOG-04] Kiểm thử tìm kiếm nhật ký (Search Logs UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Daily Conversations');
      await setInputValue(page, 'input[placeholder*="Tìm theo email"]', 'obsolete');
      await sleep(450);
      const rows = await page.$$('.course-table tbody tr');
      assert.equal(rows.length, 1);
    });

    it('[UI-LOG-05] Kiểm thử lọc theo loại hành động (Filter by Action Type)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Daily Conversations');
      await setSelectValue(page, 'select', 'TEST');
      await sleep(450);
      const rows = await page.$$('.course-table tbody tr');
      assert.equal(rows.length, 1);
      const text = await getBodyText(page);
      assert.ok(text.includes('Greetings and Introductions'));
    });

    it('[UI-LOG-06] Kiểm thử xuất báo cáo Excel nhật ký (Export Excel Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Xuất Excel');
      await clickByText(page, 'button', 'Xuất Excel');
      await waitForText(page, 'Đã xuất thành công');
      const text = await getBodyText(page);
      assert.ok(text.includes('Đã xuất thành công'));
    });

    it('[UI-LOG-07] Kiểm thử phân trang nhật ký (Pagination UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/logs');
      await waitForText(page, 'Trang 1 / 1');
      const text = await getBodyText(page);
      assert.ok(text.includes('Trang 1 / 1'));
    });
  });

  // =========================================================================
  // GROUP 23: UI-SETTING-01 .. UI-SETTING-10
  // =========================================================================
  describe('23. Cài đặt Tài khoản & Hệ thống (/admin/settings)', () => {
    it('[UI-SETTING-01] Kiểm thử bố cục Tab Cài đặt (Settings Tabs UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Cài đặt hệ thống');
      const text = await getBodyText(page);
      assert.ok(text.includes('Hồ sơ cá nhân'));
      assert.ok(text.includes('Thông tin ứng dụng'));
    });

    it('[UI-SETTING-02] Kiểm thử hiển thị thông tin hồ sơ Admin (Admin Profile Info UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu Admin');
      const text = await getBodyText(page);
      assert.ok(text.includes('SuperAdmin'));
      assert.ok(text.includes('Quản trị viên'));
    });

    it('[UI-SETTING-03] Kiểm thử form đổi mật khẩu (Change Password Form UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      const pwInputs = await page.$$('form input[type="password"]');
      assert.equal(pwInputs.length, 3);
    });

    it('[UI-SETTING-04] Kiểm thử tính năng bật/tắt hiển thị mật khẩu (Show/Hide Password Toggle UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      const toggleBtns = await page.$$('form button[type="button"]');
      assert.equal(toggleBtns.length, 3);
      await toggleBtns[0].click();
      await sleep(80);
      const firstType = await page.$eval('form input', (el) => (el as HTMLInputElement).type);
      assert.equal(firstType, 'text');
    });

    it('[UI-SETTING-05] Kiểm thử kiểm tra tính hợp lệ đổi mật khẩu khi để trống (Password Form Validation)', async () => {
      const state = resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      const isValid = await page.$eval('form', (f) => (f as HTMLFormElement).checkValidity());
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.pathname === '/auth/change-password').length, 0);
    });

    it('[UI-SETTING-06] Kiểm thử ràng buộc độ phức tạp mật khẩu (Password Complexity Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('form input') as NodeListOf<HTMLInputElement>;
        const setVal = (el: HTMLInputElement, v: string) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          setter?.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal(inputs[0], 'Admin@123');
        setVal(inputs[1], 'weakpassword123');
        setVal(inputs[2], 'weakpassword123');
      });
      await clickByText(page, 'form button[type="submit"]', 'Lưu mật khẩu mới');
      await waitForText(page, 'chữ hoa, chữ thường, chữ số và ký tự đặc biệt');
    });

    it('[UI-SETTING-07] Kiểm thử kiểm tra khớp mật khẩu xác nhận (Confirm Password Mismatch Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('form input') as NodeListOf<HTMLInputElement>;
        const setVal = (el: HTMLInputElement, v: string) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          setter?.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal(inputs[0], 'Admin@123');
        setVal(inputs[1], 'NewPass@2026');
        setVal(inputs[2], 'MismatchPass@2026');
      });
      await clickByText(page, 'form button[type="submit"]', 'Lưu mật khẩu mới');
      await waitForText(page, 'Mật khẩu mới không khớp!');
    });

    it('[UI-SETTING-08] Kiểm thử độ dài tối thiểu mật khẩu (Password Length Validation)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('form input') as NodeListOf<HTMLInputElement>;
        const setVal = (el: HTMLInputElement, v: string) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          setter?.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal(inputs[0], 'Admin@123');
        setVal(inputs[1], 'Ab1@');
        setVal(inputs[2], 'Ab1@');
      });
      await clickByText(page, 'form button[type="submit"]', 'Lưu mật khẩu mới');
      await waitForText(page, 'Mật khẩu mới phải dài ít nhất 8 ký tự!');
    });

    it('[UI-SETTING-09] Kiểm thử chức năng chuẩn (Happy Path Change Password)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Đổi mật khẩu');
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('form input') as NodeListOf<HTMLInputElement>;
        const setVal = (el: HTMLInputElement, v: string) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          setter?.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal(inputs[0], 'Admin@123');
        setVal(inputs[1], 'NewAdmin@2026');
        setVal(inputs[2], 'NewAdmin@2026');
      });
      await clickByText(page, 'form button[type="submit"]', 'Lưu mật khẩu mới');
      await waitForText(page, 'Đổi mật khẩu thành công!');
      const vals = await page.$$eval('form input', (els) => els.map((e) => (e as HTMLInputElement).value));
      assert.deepEqual(vals, ['', '', '']);
    });

    it('[UI-SETTING-10] Kiểm thử hiển thị thông tin ứng dụng (App Info Tab UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/settings');
      await waitForText(page, 'Thông tin ứng dụng');
      await clickByText(page, 'button', 'Thông tin ứng dụng');
      await waitForText(page, 'Giới thiệu ứng dụng');
      const text = await getBodyText(page);
      assert.ok(text.includes('EnglishApp'));
      assert.ok(text.includes('v1.0.0'));
      assert.ok(text.includes('Production'));
    });
  });
});
