import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage presents the supplied Coventry Judo Club design', async ({ page }) => {
  await page.goto('.');

  await expect(page).toHaveTitle(/Coventry Judo Club — Judo for kids and adults since 1957/);
  await expect(page.getByRole('heading', { name: /throw.*fall.*rise again/i })).toBeVisible();
  await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /membership/i }).first()).toHaveAttribute('href', '/membership/');
  await expect(page.getByRole('link', { name: /shop/i }).first()).toHaveAttribute('href', '/shop/');
  await expect(page.getByRole('link', { name: /contact/i }).first()).toHaveAttribute('href', '/contact/');
});

test('membership page puts plan costs before the Coacha application hand-off', async ({ page }) => {
  await page.goto('membership/');

  const plans = page.locator('#plans');
  const steps = page.locator('#steps');
  await expect(plans.getByRole('heading', { name: /choose your membership/i })).toBeVisible();
  await expect(plans.getByText(/Coacha is used by the club to manage and administer member records/i)).toBeVisible();
  await expect(plans.getByText('£20').first()).toBeVisible();
  await expect(plans.getByRole('link', { name: /continue to coacha/i }).first()).toBeVisible();
  const [plansBox, stepsBox] = await Promise.all([plans.boundingBox(), steps.boundingBox()]);
  expect(plansBox?.y).toBeLessThan(stepsBox?.y ?? Infinity);
});

test('class schedule separates junior groups and keeps Monday for seniors', async ({ page }) => {
  await page.goto('.');

  const schedule = page.locator('#schedule');
  await expect(schedule.locator('.row.head > div')).toHaveText([
    'Day',
    'Juniors · Under 8s',
    'Juniors · Over 8s',
    'Seniors'
  ]);
  const monday = schedule.locator('.row').filter({ hasText: /^Mon/ });
  await expect(monday.locator('> div')).toHaveText([
    'Mon',
    '—',
    '—',
    '6:30–8:00pm · Technical & conditioning'
  ]);
  for (const day of ['Tue', 'Thu']) {
    const sharedSession = schedule.locator('.row').filter({ hasText: new RegExp(`^${day}`) });
    await expect(sharedSession.locator('> div')).toHaveText([
      day,
      '6:00–7:00pm',
      '7:00–8:30pm',
      '7:00–8:30pm'
    ]);
  }
});

test('mobile navigation remains visible and coach cards stack in one column', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('.');

  const nav = page.getByRole('navigation', { name: /primary navigation/i });
  await expect(nav).toBeVisible();
  const navLinks = nav.getByRole('link');
  await expect(navLinks).toHaveCount(7);
  await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Events' })).toBeVisible();
  const navMetrics = await nav.locator('ul').evaluate((list) => ({
    clientWidth: list.clientWidth,
    scrollWidth: list.scrollWidth,
    links: [...list.querySelectorAll('a')].map((link) => {
      const rect = link.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
    })
  }));
  expect(navMetrics.scrollWidth).toBeLessThanOrEqual(navMetrics.clientWidth);
  expect(navMetrics.links.every(({ left, right, viewportWidth }) => left >= 0 && right <= viewportWidth)).toBeTruthy();

  const firstCoach = page.locator('.team > figure').nth(0);
  const secondCoach = page.locator('.team > figure').nth(1);
  await firstCoach.scrollIntoViewIfNeeded();
  const [firstBox, secondBox] = await Promise.all([firstCoach.boundingBox(), secondCoach.boundingBox()]);
  expect(Math.abs((firstBox?.x ?? 0) - (secondBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(secondBox?.y).toBeGreaterThan((firstBox?.y ?? 0) + (firstBox?.height ?? 0) - 1);
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
  await expect(contactForm.getByRole('heading')).toHaveCSS('color', 'rgb(244, 242, 238)');
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
  await page.goto('contact/?sent=1');
  await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(/thank you.*message has been received/i);
  await page.goto('privacy/');
  await expect(page.getByRole('heading', { name: /contact-form privacy notice/i })).toBeVisible();
  await expect(page.getByText(/Formspree/i).first()).toBeVisible();
  await expect(page.getByText(/12 months/i)).toBeVisible();
  await expect(page.getByText(/Chloe, Club Welfare Officer/i)).toBeVisible();
});

test('contact form confirms a successful submission without leaving the club site', async ({ page }) => {
  await page.route('https://formspree.io/f/xbgjenep', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('contact/');

  const contactForm = page.getByRole('form', { name: /send a message to coventry judo club/i });
  await contactForm.getByLabel(/your name/i).fill('Test visitor');
  await contactForm.getByLabel(/email address/i).fill('test@example.com');
  await contactForm.getByLabel(/message/i).fill('Please confirm this stays on the club website.');
  await contactForm.getByRole('button', { name: /send message/i }).click();

  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(contactForm.getByRole('heading', { name: 'Message sent' })).toBeVisible();
  await expect(contactForm.getByRole('status')).toHaveText(/thank you.*message has been received/i);
});

test('archive captions use the club-approved wording', async ({ page }) => {
  await page.goto('.');

  await expect(page.locator('#archive figure').nth(1).getByText('Bruce with the midland area squad')).toBeVisible();
});

test('events page presents supplied competition details and accessible navigation', async ({ page }) => {
  const localImageResponses: Array<{ url: string; status: number }> = [];
  page.on('response', (response) => {
    if (response.url().includes('/assets/uploads/') || response.url().includes('/assets/events/')) {
      localImageResponses.push({ url: response.url(), status: response.status() });
    }
  });

  await page.goto('events/');

  const eventImages = page.locator('.ev image-slot, .gal image-slot');
  await expect(eventImages).toHaveCount(7);
  for (let index = 0; index < await eventImages.count(); index += 1) {
    await eventImages.nth(index).scrollIntoViewIfNeeded();
  }
  await page.waitForFunction(() => [...document.querySelectorAll('.ev image-slot img, .gal image-slot img')].every((image) => image instanceof HTMLImageElement && image.complete));

  await expect(page).toHaveTitle(/Events — Coventry Judo Club/);
  await expect(page.getByRole('heading', { name: /on the mat.*on the podium/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'L2 Coventry Orange and Green Belt Competition' })).toBeVisible();
  await expect(page.getByText(/players graded 7th to 12th mon/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Events' }).first()).toHaveAttribute('href', '/events/');
  await expect(page.getByRole('link', { name: /enter via british judo/i })).toHaveAttribute('href', 'https://www.britishjudo.org.uk/event/l2-coventry-orange-and-green-belt-competition/');
  await expect(page.getByRole('heading', { name: 'Coach Zviad powers to World Veterans silver in Sarajevo' })).toBeVisible();
  await expect(page.getByText(/100\+ category/i)).toBeVisible();
  const zviadFeedImage = page.locator('#ev-zviad-sarajevo-2026 img');
  const zviadHonourImage = page.locator('#gal-zviad-sarajevo-2026 img');
  await expect(zviadFeedImage).toHaveAttribute('src', '/assets/events/zviad-sarajevo-veterans-silver-zviad-2-2026.jpg');
  await expect(zviadHonourImage).toHaveAttribute('src', '/assets/events/zviad-sarajevo-veterans-silver-zviad-1-2026.jpg');
  await expect(zviadFeedImage).toHaveAttribute('alt', 'Veterans medallists at the Sarajevo World Judo Championships 2026');
  await expect(zviadHonourImage).toHaveAttribute('alt', 'Coach Zviad holding his silver medal at the Sarajevo World Judo Championships Veterans 2026');
  await expect(page.locator('#honour').getByText('Zviad · Silver')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Zviad' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Sarajevo World Veterans' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '21 Sep 2026' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Vinnie' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lucas wins bronze at the Kent Open' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Lucas' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Kent Open' })).toBeVisible();
  await expect(page.locator('#ev-kent-open-2026 img')).toHaveAttribute('src', '/assets/events/lucas-kent-open-bronze-2026-card.jpg');
  expect(localImageResponses.length).toBeGreaterThan(0);
  expect(localImageResponses.every(({ status }) => status === 200)).toBeTruthy();
});

test('events medal table is keyboard-reachable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('events/');

  const medalTableRegion = page.locator('.medals');
  await expect(medalTableRegion).toHaveAttribute('tabindex', '0');
  await expect(medalTableRegion).toHaveAttribute('aria-label', /2026 competition medals/i);
});

test('footer links on secondary pages return visitors to the relevant home sections', async ({ page }) => {
  await page.goto('membership/');

  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /training schedule/i })).toHaveAttribute('href', '/#schedule');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /our team/i })).toHaveAttribute('href', '/#team');
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

test('Lee Tibbatts tile does not claim a coaching qualification', async ({ page }) => {
  await page.goto('.');

  const leeTile = page.locator('.team > figure').filter({ hasText: 'Lee Tibbatts' });
  await expect(leeTile).toContainText('Trained under world-class mentorship');
  await expect(leeTile).not.toContainText(/qualified coach/i);
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
