import { test, expect } from '@playwright/test';
import { email, origin, preferences, mockServices } from './services';

async function emailSignIn(page: import('@playwright/test').Page) {
  await page.goto(origin + '/#signup', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox.' })).toBeVisible();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify email' }).click();
}

test('landing leads to mobile signup and protects private routes without a bypass', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Local directions. A clearer way forward.' })).toBeVisible();
  await page.getByRole('button', { name: 'Get started with WakaPoint' }).click();
  await expect(page.getByRole('heading', { name: 'Good directions. Better deliveries.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveCSS('font-size', '16px');
  await expect(page.getByRole('button', { name: /demo/i })).toHaveCount(0);
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('alert')).toContainText('sign-in is unavailable');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await page.getByRole('button', { name: 'How we handle your data' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.goto('/#saved', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Where are we delivering?')).toHaveCount(0);
});

test('email signup saves onboarding, starts empty and persists a skipped tutorial', async ({ page }) => {
  const { calls } = await mockServices(page, { metadata: {} });
  await emailSignIn(page);
  await page.getByRole('radio', { name: /Merchant & business/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your home city').selectOption('Benin City');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Merchant & business/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Your home city')).toHaveValue('Benin City');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByRole('dialog')).toContainText("Start with the customer's own words.");
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(page.getByLabel('Where are we delivering?')).toHaveValue('');
  await expect(page.locator('.metric > strong')).toHaveText(['00This session', '04 address context groups', '0.00Local extraction only', '0Contact items redacted']);
  await expect.poll(() => calls.filter(call => call.method === 'PUT').length).toBe(2);
  expect(calls.find(call => call.url.includes('/otp'))!.body.create_user).toBe(true);
  expect(calls.find(call => call.url.includes('/verify'))!.body.type).toBe('email');
  expect(calls.filter(call => call.method === 'PUT')[0].body.data).toEqual({ wakapoint: { ...preferences, role: 'merchant', city: 'Benin City' } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Where are we delivering?')).toHaveValue('');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Get started with WakaPoint' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb-wakapoint-test-auth-token'))).toBeNull();
});

test('tutorial completes, restores and reopens from Help', async ({ page }) => {
  const { calls } = await mockServices(page, { signedIn: true, metadata: { wakapoint: preferences } });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Start resolving' }).click();
  await expect.poll(() => calls.some(call => JSON.stringify(call.body).includes('"tutorial":"complete"'))).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Help and tutorial' }).click();
  await page.getByRole('button', { name: 'Open guided tutorial' }).click();
  await expect(page.getByRole('dialog')).toContainText("Start with the customer's own words.");
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('account theme restores without an overwrite and toggles persist in device and account', async ({ page }) => {
  const { calls } = await mockServices(page, { signedIn: true, metadata: { wakapoint: { ...preferences, tutorial: 'skipped' }, wakapoint_theme: 'light' } });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  expect(calls.filter(call => call.method === 'PUT')).toHaveLength(0);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect.poll(() => calls.some(call => JSON.stringify(call.body).includes('"wakapoint_theme":"dark"'))).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('wakapoint.theme.v1'))).toBe('dark');
});

test('invalid email code keeps the account protected and allows correction', async ({ page }) => {
  await mockServices(page, { invalidCode: true });
  await emailSignIn(page);
  await expect(page.getByRole('alert')).toContainText('invalid or expired');
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
  await expect(page.getByLabel('Where are we delivering?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Use a different email' }).click();
  await expect(page.getByLabel('Email address')).toHaveValue(email);
});

test('failed onboarding preserves choices and offers a retry', async ({ page }) => {
  await mockServices(page, { failOnboarding: true, metadata: {} });
  await emailSignIn(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('button', { name: 'Open my workspace' })).toBeEnabled();
});

test('Google uses PKCE and a denied callback produces a recoverable error', async ({ page }) => {
  let authorizationUrl = '';
  await page.route('https://wakapoint-test.supabase.co/auth/v1/authorize**', async route => {
    authorizationUrl = route.request().url();
    await route.fulfill({ status: 302, headers: { location: origin + '/?error=access_denied&error_description=Declined' } });
  });
  await page.goto(origin + '/#signup', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('Sign-in could not be completed');
  const url = new URL(authorizationUrl);
  expect(url.searchParams.get('provider')).toBe('google');
  expect(url.searchParams.get('redirect_to')).toBe(origin + '/');
  expect(url.searchParams.get('code_challenge')).toBeTruthy();
  expect(page.url()).toBe(origin + '/');
});

test('landing and signup fit narrow mobile, landscape and enlarged text', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Get started with WakaPoint' }).click();
    await expect(page.getByLabel('Email address')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: '.auth-intro h1 { font-size: 54px } .auth-form input,.auth-google,.auth-submit { font-size: 24px }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
