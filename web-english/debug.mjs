import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  let executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (!fs.existsSync(executablePath)) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }
  
  const browser = await puppeteer.launch({ 
    executablePath, 
    headless: 'new' 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER_REQUEST_FAILED:', request.url(), request.failure()?.errorText));

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML_CONTENT:', html);

  await browser.close();
})();
