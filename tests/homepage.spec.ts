import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage presents the supplied Coventry Judo Club design', async ({ page }) => {
  await page.goto('.');

  await expect(page).toHaveTitle(/Coventry Judo Club — Judo for kids and adults since 1957/);
  await expect(page.getByRole('heading', { name: /throw.*fall.*rise again/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /membership/i }).first()).toHaveAttribute('href', '/website/membership/');
  await expect(page.getByRole('link', { name: /shop/i }).first()).toHaveAttribute('href', '/website/shop/');
  await expect(page.getByRole('link', { name: /contact/i }).first()).toHaveAttribute('href', '/website/contact/');
});

test('the four supplied pages are available from their public paths', async ({ page }) => {
  for (const path of ['.', 'membership/', 'shop/', 'contact/']) {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
  }

  await expect(page).toHaveTitle(/Contact — Coventry Judo Club/);
  await expect(page.getByRole('link', { name: '07852 237080' })).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
});

test('footer links on secondary pages return visitors to the relevant home sections', async ({ page }) => {
  await page.goto('membership/');

  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'About' })).toHaveAttribute('href', '/website/#about');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /training schedule/i })).toHaveAttribute('href', '/website/#schedule');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /our team/i })).toHaveAttribute('href', '/website/#team');
});

test('club images do not request design-editor state at runtime', async ({ page }) => {
  const editorStateRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('.image-slots.state.json')) editorStateRequests.push(request.url());
  });

  await page.goto('.');
  await page.waitForTimeout(250);
  expect(editorStateRequests).toEqual([]);
});
test('homepage has no detectable critical accessibility violations', async ({ page }) => {
  await page.goto('.');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
