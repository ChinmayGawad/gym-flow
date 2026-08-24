import { expect, test } from '@playwright/test';
import { MEMBER_EMAIL, gotoSignIn, signInAsMember } from './utils';

test.describe('Authentication journey (member onboarding)', () => {
  test('auth gate blocks the app, rejects bad credentials, and admits the seeded member', async ({
    page,
  }) => {
    // 1. Auth barrier: landing page shows the full-page AuthPage while logged out
    await gotoSignIn(page);
    await expect(page.getByRole('heading', { name: 'Member Sign In' })).toBeVisible();
    await expect(page.getByText('Real-time gym occupancy monitoring')).toBeVisible();

    // 2. Wrong credentials must bounce with visible error feedback
    await page.getByLabel('Email Address').fill(MEMBER_EMAIL);
    await page.getByLabel('Password').fill('Definitely-Wrong-Password');
    await page.getByRole('button', { name: /Sign In to GymFlow/i }).click();
    await expect(page.locator('div.bg-rose-50')).toBeVisible();

    // 3. Correct seeded credentials land inside the authenticated app shell
    await page.getByLabel('Password').fill('Member123456!');
    await page.getByRole('button', { name: /Sign In to GymFlow/i }).click();

    const scheduleLink = page.getByRole('link', { name: 'Schedule', exact: true });
    await expect(scheduleLink).toBeVisible({ timeout: 20_000 });

    // Dashboard hero is live: self check-in action available to a signed-in member
    await expect(
      page.getByRole('button', { name: /Self Check-In to Gym/i })
    ).toBeVisible();

    // Session survives a hard reload
    await page.reload();
    await expect(scheduleLink).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Self Check-In to Gym|Checked In \(Tap to Exit\)/i })
    ).toBeVisible();
  });
});
