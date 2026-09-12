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

test('the six supplied pages and the contact privacy notice are available from their public paths', async ({ page }) => {
  for (const path of ['.', 'membership/', 'shop/', 'events/', 'contact/', 'privacy/']) {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
  }

  await page.goto('contact/');
  await expect(page).toHaveTitle(/Contact — Coventry Judo Club/);
  await expect(page.getByRole('link', { name: '07852 237080' })).toBeVisible();
  const contactForm = page.getByRole('form', { name: /send a message to coventry judo club/i });
  await expect(contactForm).toBeVisible();
  await expect(contactForm).toHaveAttribute('action', 'https://formspree.io/f/xbgjenep');
  await expect(contactForm).toHaveAttribute('method', 'POST');
  await expect(contactForm.getByLabel(/your name/i)).toHaveAttribute('required', '');
  await expect(contactForm.getByLabel(/your name/i)).toBeVisible();
  await expect(contactForm.getByLabel(/email address/i)).toHaveAttribute('type', 'email');
  await expect(contactForm.getByLabel(/email address/i)).toHaveAttribute('required', '');
  await expect(contactForm.getByLabel(/message/i)).toHaveAttribute('required', '');
  await expect(contactForm.locator('input[name="_gotcha"]')).toBeHidden();
  await expect(page.getByText(/do not include safeguarding, medical or urgent concerns/i)).toBeVisible();
  await page.goto('privacy/');
  await expect(page.getByRole('heading', { name: /contact-form privacy notice/i })).toBeVisible();
  await expect(page.getByText(/Formspree/i).first()).toBeVisible();
  await expect(page.getByText(/12 months/i)).toBeVisible();
  await expect(page.getByText(/Chloe, Club Welfare Officer/i)).toBeVisible();
});

test('archive captions use the club-approved wording', async ({ page }) => {
  await page.goto('.');

  await expect(page.locator('#archive figure').nth(1).getByText('Bruce with the midland area squad')).toBeVisible();
});

test('events page presents supplied competition details and accessible navigation', async ({ page }) => {
  await page.goto('events/');

  await expect(page).toHaveTitle(/Events — Coventry Judo Club/);
  await expect(page.getByRole('heading', { name: /on the mat.*on the podium/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Events' }).first()).toHaveAttribute('href', '/website/events/');
  await expect(page.getByRole('link', { name: /enter via british judo/i })).toHaveAttribute('href', 'https://www.britishjudo.org.uk/event/l2-coventry-orange-and-green-belt-competition/');
  await expect(page.getByRole('cell', { name: 'Vinnie' })).toBeVisible();
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
test('photo credits are overlaid on their associated images', async ({ page }) => {
  await page.goto('.');

  const image = page.locator('#coach-neil img');
  const credit = page.locator('#coach-neil a');
  const [imageBox, creditBox] = await Promise.all([image.boundingBox(), credit.boundingBox()]);

  expect(creditBox?.y).toBeGreaterThan((imageBox?.y ?? 0) + (imageBox?.height ?? 0) - 60);
  expect(creditBox?.y).toBeLessThan((imageBox?.y ?? 0) + (imageBox?.height ?? 0));
});

test('coach panel height defines the patron image height on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('.');

  const patron = page.locator('.team-wrap .patron');
  const patronImage = patron.locator('.pic');
  const patronText = patron.locator('figcaption p');
  const standardCoach = page.locator('.team figure').first();
  const standardCoachImage = standardCoach.locator('.pic');
  const standardCoachText = standardCoach.locator('figcaption p');
  const [panelBox, imageBox, standardImageBox, patronTextSize, textSize] = await Promise.all([
    patron.boundingBox(),
    patronImage.boundingBox(),
    standardCoachImage.boundingBox(),
    patronText.evaluate((element) => getComputedStyle(element).fontSize),
    standardCoachText.evaluate((element) => getComputedStyle(element).fontSize)
  ]);

  expect(panelBox?.height).toBeGreaterThanOrEqual(420);
  expect(Math.abs((imageBox?.height ?? 0) - (panelBox?.height ?? 0))).toBeLessThanOrEqual(2);
  expect(standardImageBox?.height).toBe(220);
  expect(patronTextSize).toBe('16px');
  expect(textSize).toBe('16px');
});

test('homepage has no detectable critical accessibility violations', async ({ page }) => {
  await page.goto('.');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
