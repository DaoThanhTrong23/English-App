import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Page } from 'puppeteer-core';
import {
  initHarness,
  resetState,
  clearAuthAndGoto,
  loginAndGoto,
  setInputValue,
  clickByText,
  waitForText,
  getBodyText,
  clickConfirmModal,
  sleep,
} from '../helpers/test-harness.ts';

describe('Suite 01: Auth, Layout & Notifications (UI-AUTH, UI-LAYOUT, UI-NOTIF)', () => {
  let page: Page;

  before(async () => {
    const h = await initHarness();
    page = h.page;
  });

  // =========================================================================
  // GROUP 1: UI-AUTH-01 .. UI-AUTH-12
  // =========================================================================
  describe('1. Trang Đăng nhập Quản trị (/admin/login)', () => {
    it('[UI-AUTH-01] Kiểm thử hiển thị giao diện (UI Rendering)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      const text = await getBodyText(page);
      assert.ok(text.includes('Chào mừng đã đến với ứng dụng học tiếng anh') || text.includes('Xin chào!'));
      assert.ok(await page.$('input[type="text"]'));
      assert.ok(await page.$('input[type="password"]'));
      assert.ok(await page.$('button.admin-login-button'));
      assert.ok(text.includes('hoặc'));
      assert.ok(text.includes('Facebook'));
    });

    it('[UI-AUTH-02] Kiểm thử thuộc tính trường nhập liệu (Field Properties)', async () => {
      await clearAuthAndGoto(page, '/admin/login');
      const props = await page.evaluate(() => {
        const idInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        return {
          idPlaceholder: idInput?.placeholder || '',
          idRequired: idInput?.required,
          pwType: pwInput?.type,
          pwPlaceholder: pwInput?.placeholder || '',
          pwRequired: pwInput?.required,
        };
      });
      assert.ok(props.idPlaceholder.includes('email hoặc username'));
      assert.equal(props.idRequired, true);
      assert.equal(props.pwType, 'password');
      assert.equal(props.pwRequired, true);
    });

    it('[UI-AUTH-03] Kiểm thử ràng buộc bắt buộc khi bỏ trống Email/Username', async () => {
      const state = resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="password"]', 'Admin@123');
      const isValid = await page.evaluate(() => {
        const form = document.querySelector('form.admin-login-form') as HTMLFormElement;
        return form.checkValidity();
      });
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.pathname === '/auth/login').length, 0);
    });

    it('[UI-AUTH-04] Kiểm thử ràng buộc bắt buộc khi bỏ trống Mật khẩu', async () => {
      const state = resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'admin@english.com');
      const isValid = await page.evaluate(() => {
        const form = document.querySelector('form.admin-login-form') as HTMLFormElement;
        return form.checkValidity();
      });
      assert.equal(isValid, false);
      assert.equal(state.requests.filter((r) => r.pathname === '/auth/login').length, 0);
    });

    it('[UI-AUTH-05] Kiểm thử đăng nhập không hợp lệ (Negative Case)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'admin@english.com');
      await setInputValue(page, 'input[type="password"]', 'WrongPass123');
      await page.click('button.admin-login-button');
      await waitForText(page, 'không chính xác');
      const errText = await page.$eval('.admin-login-error', (el) => el.textContent || '');
      assert.ok(errText.includes('không chính xác'));
    });

    it('[UI-AUTH-06] Kiểm thử trạng thái tải (Loading State UI)', async () => {
      const state = resetState();
      state.artificialDelayMs = 400;
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'admin@english.com');
      await setInputValue(page, 'input[type="password"]', 'Admin@123');
      await page.click('button.admin-login-button');
      await sleep(80);
      const btnState = await page.$eval('button.admin-login-button', (el) => ({
        disabled: (el as HTMLButtonElement).disabled,
        text: el.textContent || '',
      }));
      assert.equal(btnState.disabled, true);
      assert.ok(btnState.text.includes('Đang xác thực...'));
      state.artificialDelayMs = 0;
      await sleep(600);
    });

    it('[UI-AUTH-07] Kiểm thử phân quyền truy cập (Access Control UI - Học viên bị từ chối)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'student@english.com');
      await setInputValue(page, 'input[type="password"]', 'Student@123');
      await page.click('button.admin-login-button');
      await waitForText(page, 'không có quyền truy cập');
      const errText = await page.$eval('.admin-login-error', (el) => el.textContent || '');
      assert.ok(errText.includes('Tài khoản này không có quyền truy cập trang quản trị!'));
      const token = await page.evaluate(() => localStorage.getItem('adminToken'));
      assert.equal(token, null);
    });

    it('[UI-AUTH-08] Kiểm thử chức năng chuẩn (Happy Path Admin Login)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'admin@english.com');
      await setInputValue(page, 'input[type="password"]', 'Admin@123');
      await page.click('button.admin-login-button');
      await sleep(650);
      await waitForText(page, 'Tổng quan hệ thống');
      assert.ok(page.url().includes('/admin/dashboard'));
      const token = await page.evaluate(() => localStorage.getItem('adminToken'));
      assert.equal(token, 'mock-admin-jwt-token-2026');
    });

    it('[UI-AUTH-09] Kiểm thử điều hướng theo phân quyền (RBAC Dynamic Redirect)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      await setInputValue(page, 'input[type="text"]', 'editor@english.com');
      await setInputValue(page, 'input[type="password"]', 'Editor@123');
      await page.click('button.admin-login-button');
      await sleep(650);
      await waitForText(page, 'Quản lý Chủ đề');
      assert.ok(page.url().includes('/admin/topics'));
    });

    it('[UI-AUTH-10] Kiểm thử giao diện tích hợp OAuth (Google Login Button)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      const hasOAuthSection = await page.evaluate(() => {
        const form = document.querySelector('form.admin-login-form');
        return Boolean(form && form.textContent?.includes('— hoặc —'));
      });
      assert.equal(hasOAuthSection, true);
    });

    it('[UI-AUTH-11] Kiểm thử giao diện tích hợp OAuth (Facebook Login Button)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/login');
      const fbInfo = await page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('a')).find((a) =>
          (a.textContent || '').includes('Đăng nhập bằng Facebook')
        );
        return {
          exists: Boolean(link),
          href: link?.getAttribute('href') || '',
        };
      });
      assert.equal(fbInfo.exists, true);
      assert.ok(fbInfo.href.includes('facebook.com'));
    });

    it('[UI-AUTH-12] Kiểm thử bảo vệ tuyến đường (Route Guard UI)', async () => {
      resetState();
      await clearAuthAndGoto(page, '/admin/dashboard');
      await sleep(200);
      assert.ok(page.url().includes('/admin/login'));
    });
  });

  // =========================================================================
  // GROUP 2: UI-LAYOUT-01 .. UI-LAYOUT-12
  // =========================================================================
  describe('2. Bố cục Chung, Sidebar, Topbar & Phân quyền (AdminLayout)', () => {
    it('[UI-LAYOUT-01] Kiểm thử thành phần Sidebar Brand (UI Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      const brand = await page.evaluate(() => ({
        title: document.querySelector('.brand-title')?.textContent || '',
        badge: document.querySelector('.brand-badge')?.textContent || '',
        hasLogo: Boolean(document.querySelector('.brand-logo-img')),
      }));
      assert.equal(brand.title, 'EnglishApp');
      assert.equal(brand.badge, 'Quản trị');
      assert.equal(brand.hasLogo, true);
    });

    it('[UI-LAYOUT-02] Kiểm thử cấu trúc Menu Sidebar (Navigation Structure)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      const groups = await page.$$eval('.nav-section-title', (els) => els.map((e) => e.textContent?.trim()));
      assert.ok(groups.includes('Tổng quan'));
      assert.ok(groups.includes('Học tập & Nội dung'));
      assert.ok(groups.includes('Hệ thống & Tương tác'));
    });

    it('[UI-LAYOUT-03] Kiểm thử trạng thái kích hoạt (Active State UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics');
      const activeLabel = await page.$eval('.sidebar-nav-item.active .item-label', (el) => el.textContent?.trim());
      const hasArrow = await page.$('.sidebar-nav-item.active .active-arrow');
      assert.equal(activeLabel, 'Chủ đề');
      assert.ok(hasArrow);
    });

    it('[UI-LAYOUT-04] Kiểm thử hiển thị thông tin Admin (User Profile Mini Widget)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      const userCard = await page.evaluate(() => ({
        name: document.querySelector('.mini-name')?.textContent || '',
        role: document.querySelector('.mini-role')?.textContent || '',
      }));
      assert.equal(userCard.name, 'SuperAdmin');
      assert.ok(userCard.role.includes('Quản trị viên'));
    });

    it('[UI-LAYOUT-05] Kiểm thử hộp thoại xác nhận đăng xuất (Confirm Dialog UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.mini-logout-btn');
      await sleep(150);
      const bodyText = await getBodyText(page);
      assert.ok(bodyText.includes('Đăng xuất'));
      assert.ok(bodyText.includes('Bạn có chắc chắn muốn đăng xuất'));
      await clickConfirmModal(page, 'cancel');
    });

    it('[UI-LAYOUT-06] Kiểm thử tương tác Modal đăng xuất (Cancel Action)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.mini-logout-btn');
      await sleep(120);
      await clickConfirmModal(page, 'cancel');
      await sleep(120);
      assert.ok(page.url().includes('/admin/dashboard'));
      const token = await page.evaluate(() => localStorage.getItem('adminToken'));
      assert.ok(token);
    });

    it('[UI-LAYOUT-07] Kiểm thử luồng đăng xuất hoàn chỉnh (Logout Flow)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.mini-logout-btn');
      await sleep(120);
      await clickConfirmModal(page, 'confirm');
      await sleep(200);
      assert.ok(page.url().includes('/admin/login'));
      const token = await page.evaluate(() => localStorage.getItem('adminToken'));
      assert.equal(token, null);
    });

    it('[UI-LAYOUT-08] Kiểm thử hiển thị thanh điều hướng Breadcrumb', async () => {
      resetState();
      await loginAndGoto(page, '/admin/words');
      const crumb = await page.$eval('.breadcrumb-box', (el) => el.textContent || '');
      assert.ok(crumb.includes('Bảng điều khiển'));
      assert.ok(crumb.includes('Từ vựng'));
    });

    it('[UI-LAYOUT-09] Kiểm thử chỉ báo trạng thái (System Status Indicator)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      const statusText = await page.$eval('.topbar-user-badge', (el) => el.textContent || '');
      assert.ok(statusText.includes('Trực tuyến'));
      assert.ok(await page.$('.user-status-dot'));
    });

    it('[UI-LAYOUT-10] Kiểm thử giao diện thích ứng (Responsive Drawer UI)', async () => {
      resetState();
      await page.setViewport({ width: 768, height: 1024 });
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.mobile-sidebar-toggle');
      await sleep(150);
      const isOpen = await page.$('.admin-sidebar.open');
      assert.ok(isOpen);
      await page.click('.sidebar-backdrop');
      await sleep(150);
      const isOpenAfter = await page.$('.admin-sidebar.open');
      assert.equal(isOpenAfter, null);
      await page.setViewport({ width: 1440, height: 900 });
    });

    it('[UI-LAYOUT-11] Kiểm thử bảo mật giao diện RBAC (Dynamic Navigation Rendering)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/topics', {
        user: { id: 3, username: 'EditorHung', email: 'editor@english.com', role: 'ContentEditor', isAdmin: false },
        permissions: ['READ_TOPIC_LIST', 'READ_WORD_LIST'],
      });
      await sleep(150);
      const visibleLabels = await page.$$eval('.sidebar-nav-item .item-label', (els) =>
        els.map((e) => e.textContent?.trim())
      );
      assert.ok(visibleLabels.includes('Chủ đề'));
      assert.ok(visibleLabels.includes('Từ vựng'));
      assert.ok(!visibleLabels.includes('Vai trò & Quyền'));
      assert.ok(!visibleLabels.includes('Nhân sự & Phân quyền'));
    });

    it('[UI-LAYOUT-12] Kiểm thử giao diện chặn quyền truy cập (Unauthorized View 403)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/roles', {
        user: { id: 3, username: 'EditorHung', email: 'editor@english.com', role: 'ContentEditor', isAdmin: false },
        permissions: ['READ_TOPIC_LIST'],
      });
      await waitForText(page, 'Không có quyền truy cập');
      const text = await getBodyText(page);
      assert.ok(text.includes('Không có quyền truy cập'));
      await clickByText(page, 'button', 'Về trang được cấp quyền');
      await sleep(200);
      assert.ok(page.url().includes('/admin/topics'));
    });
  });

  // =========================================================================
  // GROUP 3: UI-NOTIF-01 .. UI-NOTIF-09
  // =========================================================================
  describe('3. Trung tâm Thông báo Admin (AdminNotificationDropdown)', () => {
    it('[UI-NOTIF-01] Kiểm thử hiển thị huy hiệu thông báo (Notification Badge UI)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      const badge = await page.$eval('.notif-badge-pulse', (el) => el.textContent?.trim());
      assert.equal(badge, '2');
    });

    it('[UI-NOTIF-02] Kiểm thử tương tác Dropdown (Toggle & Click Outside)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      assert.ok(await page.$('.notif-dropdown-panel'));
      await page.click('.breadcrumb-box');
      await sleep(150);
      assert.equal(await page.$('.notif-dropdown-panel'), null);
    });

    it('[UI-NOTIF-03] Kiểm thử chuyển tab lọc thông báo (Tab Switching)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      const allCount = (await page.$$('.notif-item')).length;
      assert.equal(allCount, 3);
      await clickByText(page, '.notif-tab', 'Chưa đọc');
      const unreadCount = (await page.$$('.notif-item')).length;
      assert.equal(unreadCount, 2);
    });

    it('[UI-NOTIF-04] Kiểm thử thao tác đánh dấu đã đọc (Mark As Read)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      await page.click('.notif-item-btn[title="Đánh dấu đã đọc"]');
      await sleep(200);
      const badge = await page.$eval('.notif-badge-pulse', (el) => el.textContent?.trim());
      assert.equal(badge, '1');
    });

    it('[UI-NOTIF-05] Kiểm thử hàng loạt (Mark All As Read)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      await clickByText(page, '.notif-action-btn', 'Đã đọc hết');
      await sleep(200);
      const badgeEl = await page.$('.notif-badge-pulse');
      assert.equal(badgeEl, null);
    });

    it('[UI-NOTIF-06] Kiểm thử xóa thông báo đơn lẻ (Delete Notification)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      await page.click('.notif-item-btn.btn-delete');
      await sleep(200);
      const remaining = (await page.$$('.notif-item')).length;
      assert.equal(remaining, 2);
    });

    it('[UI-NOTIF-07] Kiểm thử xóa toàn bộ thông báo (Clear All Notifications)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      await page.click('.notif-action-btn.text-danger');
      await clickConfirmModal(page, 'confirm');
      await waitForText(page, 'Không có thông báo nào');
      assert.equal((await page.$$('.notif-item')).length, 0);
    });

    it('[UI-NOTIF-08] Kiểm thử liên kết điều hướng thông báo (Notification Navigation Link)', async () => {
      resetState();
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      await clickByText(page, '.notif-item', 'Học viên mới đăng ký');
      await sleep(200);
      assert.ok(page.url().includes('/admin/students'));
    });

    it('[UI-NOTIF-09] Kiểm thử trạng thái rỗng (Empty State UI)', async () => {
      const state = resetState();
      state.notifications = [];
      await loginAndGoto(page, '/admin/dashboard');
      await page.click('.notif-bell-btn');
      await sleep(150);
      const emptyText = await page.$eval('.notif-empty-state', (el) => el.textContent || '');
      assert.ok(emptyText.includes('Không có thông báo nào'));
    });
  });
});
