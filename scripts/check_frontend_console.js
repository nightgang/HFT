const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'], headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const messages = [];

  page.on('console', (msg) => {
    try {
      messages.push({ type: 'console.' + msg.type(), text: msg.text(), location: msg.location() });
    } catch (e) {
      messages.push({ type: 'console', text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    messages.push({ type: 'pageerror', text: err.message, stack: err.stack });
  });

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'load', timeout: 30000 });
  } catch (e) {
    messages.push({ type: 'navigationError', text: e.message });
  }

  // Wait to capture runtime errors
  await page.waitForTimeout(5000);

  // Also capture network failures from window
  try {
    const windowErrors = await page.evaluate(() => {
      return window.__capturedRuntimeErrors || [];
    });
    if (Array.isArray(windowErrors) && windowErrors.length) messages.push({ type: 'windowErrors', data: windowErrors });
  } catch (e) {}

  console.log(JSON.stringify(messages, null, 2));
  await browser.close();
  process.exit(0);
})();
