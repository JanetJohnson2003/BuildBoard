import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  // The dev server is at 5173 but wait, is the user logged in?
  // If not, it will redirect to /login. If the error is in login, we will see it.
  // If the error is in /karthik01/hi, we need to bypass login or see what happens.
  try {
    await page.goto('http://localhost:5173/karthik01/hi', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.error('PUPPETEER ERROR:', err);
  }

  await browser.close();
})();
