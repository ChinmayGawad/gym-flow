import { expect, test, type Page } from '@playwright/test';
import { signInAsMember } from './utils';

/**
 * The startup seed distributes several sample visits across the demo member,
 * so the schedule board can surface them one at a time. Drain them all to
 * reach a clean slate before planning a fresh visit.
 */
async function drainPlannedVisits(page: Page) {
  for (let i = 0; i < 10; i++) {
    const cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
    if (!(await cancelBtn.isVisible().catch(() => false))) return;
    await cancelBtn.click();
    await expect(cancelBtn).toBeHidden({ timeout: 15_000 });
  }
}

test.describe('Plan-a-visit journey (visit scheduling)', () => {
  test('member plans a gym visit, sees it confirmed, then cancels it', async ({ page }) => {
    await signInAsMember(page);

    // Navigate to the schedule board via the navbar
    await page.getByRole('link', { name: 'Schedule', exact: true }).click();
    const planVisitButton = page.getByRole('button', { name: 'Plan Visit' });
    await expect(planVisitButton).toBeVisible();

    // Clean slate: drop any seeded/leftover planned visits
    await drainPlannedVisits(page);
    await expect(page.getByText('Your Scheduled Visit')).toBeHidden();

    // Open the planning modal and confirm the default suggested slot (11:00 AM)
    await planVisitButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Plan Your Gym Visit')).toBeVisible();

    await dialog.getByRole('button', { name: /Confirm Visit for/i }).click();

    // Confirmed banner appears with the user's scheduled slot
    const banner = page.getByText('Your Scheduled Visit');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
    await expect(planVisitButton).toBeVisible(); // modal closed, board usable again

    // Cancel the planned visit; banner disappears
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(banner).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText('Confirmed', { exact: true })).toBeHidden();
  });
});
