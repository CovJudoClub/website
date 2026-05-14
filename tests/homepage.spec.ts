import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage renders the draft club scaffold', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Coventry Judo Club/);
  await expect(page.getByRole('heading', { name: /modern home for Coventry Judo Club/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible();
  await expect(page.getByRole('note')).toContainText(/require approval/i);
});

test('homepage has no detectable critical accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
