import { expect, test, type Page } from '@playwright/test';
import { signInAsMember } from './utils';

/**
 * The "Inside Facility" stat card renders `{peopleCount} / {capacity}`.
 * Scoped lookup keeps us away from other numeric cards on the dashboard.
 */
async function readInsideCount(page: Page): Promise<number> {
  const card = page.locator('div.grid > div', { hasText: 'Inside Facility' }).first();
  const text = await card.innerText();
  const match = text.match(/(\d+)\s*\//);
  expect(match, `counter text should contain a count: ${text}`).toBeTruthy();
  return Number(match![1]);
}

test.describe('Self check-in journey (large task: live occupancy)', () => {
  test('checking in increments the live headcount and checking out restores it', async ({
    page,
  }) => {
    await signInAsMember(page);

    const checkInButton = page.getByRole('button', {
      name: /Self Check-In to Gym|Checked In \(Tap to Exit\)/i,
    });
    await expect(checkInButton).toBeVisible();

    // Self-heal from any leftover checked-in state of previous runs
    if ((await checkInButton.innerText()).includes('Tap to Exit')) {
      await checkInButton.click();
      await expect(page.getByRole('button', { name: /Self Check-In to Gym/i })).toBeVisible();
    }

    const before = await readInsideCount(page);

    // Check in -> button flips and the live facility counter ticks up by one
    await page.getByRole('button', { name: /Self Check-In to Gym/i }).click();
    await expect(
      page.getByRole('button', { name: /Checked In \(Tap to Exit\)/i })
    ).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(() => readInsideCount(page), { timeout: 20_000 })
      .toBe(before + 1);

    // Check out -> state and headcount return to baseline
    await page.getByRole('button', { name: /Checked In \(Tap to Exit\)/i }).click();
    await expect(page.getByRole('button', { name: /Self Check-In to Gym/i })).toBeVisible({
      timeout: 20_000,
    });

    await expect.poll(() => readInsideCount(page), { timeout: 20_000 }).toBe(before);
  });
});
