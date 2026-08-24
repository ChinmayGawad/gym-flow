import { chromium } from '@playwright/test';

const base = 'http://localhost:5174';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });

page.on('response', (r) => {
  if (r.url().includes('/api/')) {
    console.log('API>', r.request().method(), r.url().replace(base, ''), '->', r.status());
  }
});
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE-ERR>', m.text().slice(0, 300));
});

await page.goto(base);
await page.getByLabel('Email Address').fill('member@gymflow.com');
await page.getByLabel('Password').fill('Member123456!');
await page.getByRole('button', { name: /Sign In to GymFlow/i }).click();
await page.getByRole('link', { name: 'Schedule', exact: true }).waitFor({ timeout: 20000 });
await page.getByRole('link', { name: 'Schedule', exact: true }).click();
await page.getByRole('button', { name: 'Plan Visit' }).waitFor({ timeout: 20000 });

const dump = async (label) => {
  const info = await page.evaluate(() => ({
    url: location.href,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    buttons: [...document.querySelectorAll('button')]
      .map((b) => `${b.offsetParent ? '+' : '-'}${b.innerText.trim().slice(0, 40)}`)
      .slice(0, 25),
    bannerText: [...document.querySelectorAll('div')].some((d) =>
      d.textContent?.includes('Your Scheduled Visit')
    ),
    bodyLen: document.body.innerHTML.length,
  }));
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(info, null, 1));
};

await dump('schedule loaded');

const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
if (await cancelBtn.isVisible().catch(() => false)) {
  await cancelBtn.click();
  await page.waitForTimeout(4000);
  await dump('after cancel click');
} else {
  console.log('\nNo Cancel button visible after load');
}

await browser.close();
