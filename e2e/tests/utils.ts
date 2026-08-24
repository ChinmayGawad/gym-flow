import { expect, type Page } from '@playwright/test';

export const MEMBER_EMAIL = 'member@gymflow.com';
export const MEMBER_PASSWORD = 'Member123456!';

/** Opens the app logged-out and waits for the full-page AuthPage gate. */
export async function gotoSignIn(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'GYMFLOW' })).toBeVisible();
}

/** Signs in through the UI as the seeded demo member and waits for the app shell. */
export async function signInAsMember(page: Page) {
  await gotoSignIn(page);
  await page.getByLabel('Email Address').fill(MEMBER_EMAIL);
  await page.getByLabel('Password').fill(MEMBER_PASSWORD);
  await page.getByRole('button', { name: /Sign In to GymFlow/i }).click();
  await expect(page.getByRole('link', { name: 'Schedule', exact: true })).toBeVisible({
    timeout: 20_000,
  });
}
