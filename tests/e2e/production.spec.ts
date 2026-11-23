import { test, expect } from '@playwright/test';
import { origin, mockServices } from './services';

test('secure email links open a workspace on a browser without a PKCE verifier', async ({ page }) => {
  const { calls } = await mockServices(page);
  await page.goto(`${origin}/auth/callback?token_hash=${'a'.repeat(56)}&type=email`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Where are we delivering?')).toBeVisible();
  expect(calls.find(call => call.url.includes('/auth/v1/verify'))?.body).toMatchObject({ token_hash: 'a'.repeat(56), type: 'email' });
  expect(page.url()).not.toContain('token_hash');
});

test('unconfigured Google is clear and email entry remains available', async ({ page }) => {
  await mockServices(page, { googleDisabled: true });
  await page.goto(origin + '/signin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  await expect(page.getByText('Google sign-in is being set up. Continue with email.')).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeEnabled();
});

test('server-rejected persisted sessions cannot open the private workspace', async ({ page }) => {
  await mockServices(page, { signedIn: true, expiredSession: true });
  await page.goto(origin + '/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('sign in again');
  await expect(page.getByLabel('Where are we delivering?')).toHaveCount(0);
});

test('notifications retain read status and link to the appropriate workspace page', async ({ page }) => {
  const { calls } = await mockServices(page, { signedIn: true, notifications: [{ id: '11111111-1111-4111-8111-111111111111', kind: 'address_saved', title: 'Address saved', body: 'A new address is ready in your private library.', action: 'saved', created_at: '2026-11-22T08:00:00Z', read_at: null }] });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Notifications, 1 unread' }).click();
  await expect(page.getByRole('dialog')).toContainText('Address saved');
  await page.getByRole('button', { name: /Mark all read/ }).click();
  await expect(page.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
  expect(calls.find(call => call.method === 'PATCH')?.body).toHaveProperty('read_at');
  await page.getByRole('dialog').getByRole('button', { name: /Address saved/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#saved$/);
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Address saved');
  await expect(page.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
});

test('notification errors offer retry without hiding the workspace', async ({ page }) => {
  await mockServices(page, { signedIn: true, notificationError: true });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Where are we delivering?')).toBeVisible();
});
