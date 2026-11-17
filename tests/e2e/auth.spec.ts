import { test, expect, type Page } from '@playwright/test';

const origin = 'http://127.0.0.1:4174';
const email = 'test@example.com';
const preferences = { version: 1, role: 'dispatch', city: 'Abuja', firstTask: 'resolve' };
const session = { access_token: 'synthetic-user-access-token-123456789', refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: 'test-account', email, aud: 'authenticated', role: 'authenticated', user_metadata: {} } };

async function mockAuth(page: Page, options: { invalidCode?: boolean; failOnboarding?: boolean } = {}) {
  let user = { ...session.user };
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  await page.route('https://wakapoint-test.supabase.co/**', async route => {
    const request = route.request();
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': '*' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return; }
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : {};
    calls.push({ url: request.url(), body });
    if (request.url().includes('/auth/v1/otp')) { await route.fulfill({ json: {}, headers: cors }); return; }
    if (request.url().includes('/auth/v1/verify')) {
      await route.fulfill(options.invalidCode ? { status: 403, json: { error_code: 'otp_expired', msg: 'Token has expired or is invalid' }, headers: cors } : { json: { ...session, user }, headers: cors }); return;
    }
    if (request.url().includes('/auth/v1/user')) {
      if (request.method() === 'PUT') {
        if (options.failOnboarding) { await route.fulfill({ status: 503, json: { message: 'Unavailable' }, headers: cors }); return; }
        user = { ...user, user_metadata: body.data as Record<string, unknown> };
      }
      await route.fulfill({ json: user, headers: cors }); return;
    }
    if (request.url().includes('/rest/v1/saved_addresses')) { await route.fulfill({ json: [], headers: cors }); return; }
    if (request.url().includes('/auth/v1/logout')) { await route.fulfill({ status: 204, headers: cors }); return; }
    await route.fulfill({ status: 400, json: { error: 'Unexpected test request' }, headers: cors });
  });
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  return calls;
}

async function emailSignIn(page: Page) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('heading', { name: 'Check your inbox.' })).toBeVisible();
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify email' }).click();
}

test('mobile signup has email and Google, explains inactive auth, and demo onboarding works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Good directions. Better deliveries.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveCSS('font-size', '16px');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('alert')).toContainText('being activated');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await page.getByRole('button', { name: 'How we handle your data' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: /A workspace that/ })).toBeFocused();
  await page.getByRole('radio', { name: /Merchant & business/ }).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your home city').selectOption('Lagos');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Merchant & business/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Your home city')).toHaveValue('Lagos');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByLabel('Where are we delivering?')).toHaveValue(/Ikeja/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Every address. A way forward.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Exit demo' }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(errors).toEqual([]);
});

test('email signup verifies a code, persists onboarding to Auth and restores an account session', async ({ page }) => {
  const calls = await mockAuth(page);
  await emailSignIn(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your home city').selectOption('Benin City');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: /Process a dispatch list/ }).check();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A hundred addresses. One workflow.' })).toBeVisible();
  const otp = calls.find(call => call.url.includes('/otp'))!;
  expect(otp.body.email).toBe(email);
  expect(otp.body.create_user).toBe(true);
  expect(calls.find(call => call.url.includes('/verify'))!.body.type).toBe('email');
  expect(calls.find(call => call.url.includes('/user') && call.body.data)!.body.data).toEqual({ wakapoint: { ...preferences, city: 'Benin City', firstTask: 'batch' } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'A hundred addresses. One workflow.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb-wakapoint-test-auth-token'))).toBeNull();
});

test('invalid email code keeps the user out of the workspace and supports correcting their email', async ({ page }) => {
  await mockAuth(page, { invalidCode: true });
  await emailSignIn(page);
  await expect(page.getByRole('alert')).toContainText('invalid or expired');
  await expect(page.getByRole('button', { name: /Resend code in/ })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Every address. A way forward.' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Use a different email' }).click();
  await expect(page.getByLabel('Email address')).toHaveValue(email);
});

test('failed onboarding save preserves choices and provides a retry', async ({ page }) => {
  await mockAuth(page, { failOnboarding: true });
  await emailSignIn(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Open my workspace' }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('button', { name: 'Open my workspace' })).toBeEnabled();
});

test('Google uses a PKCE authorization redirect and handles a denied callback', async ({ page }) => {
  let authorizationUrl = '';
  await page.route('https://wakapoint-test.supabase.co/auth/v1/authorize**', async route => {
    authorizationUrl = route.request().url();
    await route.fulfill({ status: 302, headers: { location: origin + '/?error=access_denied&error_description=Declined' } });
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByRole('alert')).toContainText('Sign-in could not be completed');
  const url = new URL(authorizationUrl);
  expect(url.searchParams.get('provider')).toBe('google');
  expect(url.searchParams.get('redirect_to')).toBe(origin + '/');
  expect(url.searchParams.get('code_challenge')).toBeTruthy();
  expect(page.url()).toBe(origin + '/');
});

test('auth fits narrow mobile, landscape and enlarged text without clipping controls', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explore the demo' })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: '.auth-intro h1 { font-size: 54px } .auth-form input,.auth-google,.auth-submit { font-size: 24px }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
