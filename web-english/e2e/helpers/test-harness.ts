import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import { createServer, type ViteDevServer } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as XLSX from 'xlsx';
import { createDefaultMockState, handleMockRequest, type MockState } from './mock-api.ts';

function resolveBrowserPath(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidates: string[] = [
    // Windows Chrome
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),

    // Windows Microsoft Edge (Chromium - mặc định có trên Windows)
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),

    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',

    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Không tìm thấy Google Chrome hoặc Microsoft Edge. Vui lòng cài đặt trình duyệt hoặc chỉ định biến môi trường CHROME_PATH.'
  );
}

const CHROME_PATH = resolveBrowserPath();

export let BASE_URL = 'http://localhost:5173';
const TEMP_DIR = path.join(os.tmpdir(), 'web-english-e2e-files');

let sharedServer: ViteDevServer | null = null;
let sharedBrowser: Browser | null = null;
let sharedPage: Page | null = null;
let sharedState: MockState = createDefaultMockState();
let lastDialogMessage: string | null = null;

export async function initHarness(): Promise<{
  browser: Browser;
  page: Page;
  state: MockState;
}> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  if (!sharedServer) {
    sharedServer = await createServer({
      root: path.resolve(import.meta.dirname, '../..'),
      server: {
        port: 5173,
        strictPort: false,
        host: 'localhost',
      },
      logLevel: 'silent',
    });
    await sharedServer.listen();
    const resolvedLocal = sharedServer.resolvedUrls?.local?.[0];
    if (resolvedLocal) {
      BASE_URL = resolvedLocal.replace(/\/+$/, '');
    }
  }

  if (!sharedBrowser) {
    sharedBrowser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: process.env.HEADLESS === 'false' ? false : true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1440,900',
      ],
      defaultViewport: { width: 1440, height: 900 },
    });
  }

  if (!sharedPage || sharedPage.isClosed()) {
    sharedPage = await sharedBrowser.newPage();
    await sharedPage.setRequestInterception(true);

    sharedPage.on('request', async (req) => {
      try {
        const handled = await handleMockRequest(req, sharedState);
        if (!handled) {
          await req.continue();
        }
      } catch {
        try {
          if (!req.isInterceptResolutionHandled()) {
            await req.continue();
          }
        } catch {
          // ignore
        }
      }
    });

    sharedPage.on('dialog', async (dialog) => {
      lastDialogMessage = dialog.message();
      await dialog.dismiss();
    });

    // Auto-wait wrapper for page.click and page.$eval so lazy-loaded components don't race
    const origClick = sharedPage.click.bind(sharedPage);
    sharedPage.click = async (selector: string, options?: any) => {
      await sharedPage!.waitForSelector(selector, { timeout: 3000 }).catch(() => { });
      return origClick(selector, options);
    };

    const origEval = sharedPage.$eval.bind(sharedPage);
    (sharedPage as any).$eval = async (selector: string, pageFunction: any, ...args: any[]) => {
      await sharedPage!.waitForSelector(selector, { timeout: 3000 }).catch(() => { });
      return origEval(selector, pageFunction, ...args);
    };

    // Stub Audio.prototype.play and URL.createObjectURL download tracking in every document
    await sharedPage.evaluateOnNewDocument(() => {
      (window as any).__xssTriggered = false;
      (window as any).__audioPlayedCount = 0;
      (window as any).__lastAudioSrc = '';
      (window as any).__downloadedFiles = [] as string[];

      const origPlay = window.HTMLMediaElement.prototype.play;
      window.HTMLMediaElement.prototype.play = function () {
        (window as any).__audioPlayedCount = ((window as any).__audioPlayedCount || 0) + 1;
        (window as any).__lastAudioSrc = this.src || '';
        try {
          return origPlay ? origPlay.call(this).catch(() => { }) : Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      };

      const origAnchorClick = window.HTMLAnchorElement.prototype.click;
      window.HTMLAnchorElement.prototype.click = function () {
        const dl = this.getAttribute('download');
        if (dl) {
          (window as any).__downloadedFiles = (window as any).__downloadedFiles || [];
          (window as any).__downloadedFiles.push(dl);
          return;
        }
        return origAnchorClick.call(this);
      };
    });
  }

  return {
    browser: sharedBrowser,
    page: sharedPage,
    state: sharedState,
  };
}

export async function closeHarness(): Promise<void> {
  if (sharedPage && !sharedPage.isClosed()) {
    await sharedPage.close().catch(() => { });
    sharedPage = null;
  }
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => { });
    sharedBrowser = null;
  }
  if (sharedServer) {
    await sharedServer.close().catch(() => { });
    sharedServer = null;
  }
}

export function resetState(): MockState {
  const fresh = createDefaultMockState();
  Object.assign(sharedState, fresh);
  lastDialogMessage = null;
  return sharedState;
}

export function getState(): MockState {
  return sharedState;
}

export function getLastDialog(): string | null {
  return lastDialogMessage;
}

export function clearLastDialog(): void {
  lastDialogMessage = null;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function gotoRoute(page: Page, routePath: string): Promise<void> {
  const url = routePath.startsWith('http') ? routePath : `${BASE_URL}${routePath}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait for React.lazy Suspense fallback ("Đang tải dữ liệu trang...") to finish
  const start = Date.now();
  while (Date.now() - start < 4000) {
    const ready = await page
      .evaluate(() => {
        const root = document.getElementById('root');
        if (!root || root.children.length === 0) return false;
        const text = document.body.innerText || '';
        return !text.includes('Đang tải dữ liệu trang...');
      })
      .catch(() => false);
    if (ready) break;
    await sleep(60);
  }
  await sleep(220);
}

export async function loginAndGoto(
  page: Page,
  routePath: string,
  options?: {
    user?: any;
    permissions?: string[];
    token?: string;
  }
): Promise<void> {
  const state = getState();
  const user = options?.user || state.currentAdminUser;
  const perms = options?.permissions || state.currentPermissions;
  const token = options?.token || 'mock-admin-jwt-token-2026';

  state.currentAdminUser = user;
  state.currentPermissions = perms;

  // Ensure we are on origin first
  if (!page.url().startsWith(BASE_URL)) {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  }

  await page.evaluate(
    ({ tk, usr, prms }) => {
      localStorage.setItem('adminToken', tk);
      localStorage.setItem('adminInfo', JSON.stringify(usr));
      localStorage.setItem('adminUser', JSON.stringify(usr));
      localStorage.setItem('adminPermissions', JSON.stringify(prms));
    },
    { tk: token, usr: user, prms: perms }
  );

  await gotoRoute(page, routePath);
}

export async function clearAuthAndGoto(page: Page, routePath: string): Promise<void> {
  if (!page.url().startsWith(BASE_URL)) {
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  }
  await page.evaluate(() => {
    localStorage.clear();
  });
  await gotoRoute(page, routePath);
}

export async function setInputValue(page: Page, selector: string, value: string): Promise<void> {
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) throw new Error(`Element not found: ${sel}`);
      el.focus();
      const proto =
        el instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { sel: selector, val: value }
  );
}

export async function setSelectValue(page: Page, selector: string, value: string): Promise<void> {
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null;
      if (!el) throw new Error(`Select not found: ${sel}`);
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { sel: selector, val: value }
  );
}

export async function clickByText(
  page: Page,
  selector: string,
  text: string,
  exact = false
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < 2500) {
    const clicked = await page
      .evaluate(
        ({ sel, txt, ex }) => {
          const allElements = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
          // Prefer elements outside .admin-sidebar unless selector explicitly targets sidebar
          const preferNonSidebar = !sel.includes('sidebar');
          const candidates = preferNonSidebar
            ? [
              ...allElements.filter((el) => !el.closest('.admin-sidebar')),
              ...allElements.filter((el) => Boolean(el.closest('.admin-sidebar'))),
            ]
            : allElements;

          for (const el of candidates) {
            const content = (el.innerText || el.textContent || '').trim();
            const matches = ex ? content === txt : content.includes(txt);
            if (matches) {
              el.scrollIntoView({ block: 'center', inline: 'center' });
              el.click();
              return true;
            }
          }
          return false;
        },
        { sel: selector, txt: text, ex: exact }
      )
      .catch(() => false);

    if (clicked) {
      await sleep(120);
      return true;
    }
    await sleep(80);
  }
  return false;
}

export async function waitForText(page: Page, text: string, timeoutMs = 4000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const bodyText = await getBodyText(page);
    if (bodyText.includes(text)) return true;
    await sleep(80);
  }
  return false;
}

export async function getBodyText(page: Page): Promise<string> {
  return page.evaluate(() => (document.body.innerText || '') + '\n' + (document.body.textContent || ''));
}

export async function getToastMessages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const results: string[] = [];
    const classEls = Array.from(document.querySelectorAll('.toast-item, .toast-message'));
    for (const el of classEls) {
      const t = (el.textContent || '').trim();
      if (t) results.push(t);
    }
    // ToastContext uses a fixed container with zIndex: 99999
    const allDivs = Array.from(document.querySelectorAll('div')) as HTMLElement[];
    for (const d of allDivs) {
      if (d.style && d.style.zIndex === '99999') {
        for (const child of Array.from(d.children)) {
          const t = (child.textContent || '').trim();
          if (t) results.push(t);
        }
      }
    }
    return results;
  });
}

export async function clickConfirmModal(page: Page, action: 'confirm' | 'cancel' = 'confirm'): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < 2000) {
    const clicked = await page
      .evaluate((act) => {
        const classSel = act === 'confirm' ? '.confirm-btn-confirm' : '.confirm-btn-cancel';
        const classBtn = document.querySelector(classSel) as HTMLElement | null;
        if (classBtn) {
          classBtn.click();
          return true;
        }
        // ToastContext confirm modal uses a fixed overlay div with zIndex: 99998
        const allDivs = Array.from(document.querySelectorAll('div')) as HTMLElement[];
        for (const d of allDivs) {
          if (d.style && d.style.zIndex === '99998') {
            const buttons = Array.from(d.querySelectorAll('button')) as HTMLButtonElement[];
            if (buttons.length >= 2) {
              const target = act === 'cancel' ? buttons[0] : buttons[buttons.length - 1];
              target.click();
              return true;
            }
          }
        }
        return false;
      }, action)
      .catch(() => false);

    if (clicked) {
      await sleep(200);
      return true;
    }
    await sleep(60);
  }
  return false;
}

export function createTempFile(filename: string, content: Buffer | string): string {
  const fullPath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(fullPath, content);
  return fullPath;
}

export function createExcelTempFile(filename: string, rows: Record<string, any>[], sheetName = 'Sheet1'): string {
  const ws = rows.length > 0 ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([['headword', 'meaning', 'partOfSpeech', 'cefrLevel']]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return createTempFile(filename, buf);
}
