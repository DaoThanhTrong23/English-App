const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER_REQUEST_FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
  
  // Wait a bit to catch any late errors
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await browser.close();
})();
