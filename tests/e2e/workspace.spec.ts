import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { EXAMPLES } from '../../src/lib/addressResolver';
import { createGateway } from '../../supabase/functions/wakapoint-gateway/core';

const syntheticAddress = 'Shop 14, beside the market, blue gate, Ikeja, Lagos, recipient: Test Person, 08012345678, demo@example.com';
const code = 'FC-01-A01-KP-27';
const cloudOrigin = 'http://127.0.0.1:4174';

test.beforeEach(async ({ page }) => {
  // Deterministic map outage; the online map is exercised separately.
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
});

async function resolve(page: Page, value: string) {
  await page.getByLabel('Where are we delivering?').fill(value);
  await page.getByRole('button', { name: 'Resolve address', exact: true }).click();
}

test('dispatch redacts, requires review, exports, persists, deletes and restores', async ({ page }) => {
  await page.goto('/');
  await resolve(page, syntheticAddress);
  await page.getByRole('tab', { name: 'JSON response' }).click();
  const output = await page.getByRole('tabpanel').innerText();
  for (const privateValue of ['Test Person', '08012345678', 'demo@example.com']) expect(output).not.toContain(privateValue);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Export JSON' })).toBeDisabled();
  await dialog.getByRole('checkbox').check();
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.verified).toBe(false);
  expect(exported.privacy.redacted_items).toBe(3);
  expect(exported.nipost_digital_postcode).toBeNull();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: /Saved addresses/ }).first().click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.reload();
  await page.getByRole('button', { name: /^Open/ }).click();
  await page.getByRole('tab', { name: 'JSON response' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('"redacted_items": 3');
  await page.getByRole('button', { name: /Saved addresses/ }).first().click();
  await page.getByRole('button', { name: 'Remove Ikeja' }).click();
  await expect(page.getByRole('heading', { name: 'Your library starts with one good address' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(2);
});

test('changed input blocks handoff, and unresolved or conflicting geography explains the review', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Where are we delivering?').fill('Green gate, Ikeja, Abuja');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
  await page.getByLabel('Where are we delivering?').press('Control+Enter');
  await expect(page.getByRole('status')).toContainText('different states');
  await resolve(page, 'Behind the school, unknown settlement');
  await expect(page.getByRole('status')).toContainText('Add a supported city');
  await expect(page.getByRole('button', { name: 'Place delivery pin' })).toBeDisabled();
});

test('batch processes, filters, paginates and exports reviewed data', async ({ page }) => {
  await page.goto('/#batch');
  const rows = [...Array.from({ length: 21 }, (_, i) => `Shop ${i + 1}, behind market, Ikeja`), 'Unknown village'];
  await page.getByLabel('One address per line').fill(rows.join('\n'));
  await page.getByRole('button', { name: 'Process addresses' }).click();
  await expect(page.getByRole('row')).toHaveCount(21);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(3);
  await page.getByLabel('Filter batch results').selectOption('detail');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv.split('\r\n')).toHaveLength(23);
  await page.getByLabel('One address per line').fill(Array(101).fill('Ikeja').join('\n'));
  await page.getByRole('button', { name: 'Process addresses' }).click();
  await expect(page.getByRole('alert')).toContainText('100 addresses');
});

test('postcode format checks stay local while the service is inactive', async ({ page }) => {
  await page.goto('/#postcode');
  await page.getByLabel('NIPOST digital postcode').fill('fc 01 a01 kp 27');
  await expect(page.locator('.segment strong')).toHaveText(['FC', '01', 'A01', 'KP', '27']);
  await expect(page.getByRole('button', { name: 'Verify with NIPOST' })).toBeDisabled();
  await page.getByLabel('NIPOST digital postcode').fill('FC-00-A01-KP-27');
  await expect(page.locator('.inline-error')).toContainText('cannot be 00');
  await expect(page.getByText('Official search is awaiting service activation.', { exact: false })).toBeVisible();
});

test('storage failure reports an error and keeps the library unchanged', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'QuotaExceededError'); }; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('The address library could not save this change.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /Saved addresses/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Your library starts with one good address' })).toBeVisible();
});

test('mobile navigation, long input, checkout and privacy work without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await resolve(page, `Shop 14, ${'LongLandmark'.repeat(100)}, Ikeja`);
  for (const view of ['Address resolver', 'Batch studio', 'Saved addresses', 'Postcode bridge', 'Developer tools', 'Privacy shield']) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog').getByRole('button', { name: view, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel('Test an address with contact details').fill(syntheticAddress);
  const filtered = await page.locator('.privacy-demo pre').innerText();
  expect(filtered).not.toContain('08012345678');
  expect(filtered).not.toContain('Test Person');
  await page.goto('/#developers');
  await page.getByLabel('Delivery address').fill(EXAMPLES[2].text);
  await page.getByRole('button', { name: 'Review delivery details' }).click();
  await expect(page.locator('.checkout-preview .status-box')).toContainText('Ikeja');
  expect(errors).toEqual([]);
});

test('keyboard tabs, reduced motion, dialog focus and offline map are usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('Offline schematic', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place delivery pin' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Extracted entities' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Delivery cues' })).toBeFocused();
  await page.getByRole('button', { name: 'Help and demo guide' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  const transition = await page.getByRole('dialog').evaluate(el => getComputedStyle(el).transitionDuration);
  expect(transition).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Help and demo guide' })).toBeFocused();
});

test('online map supports keyboard placement, confirmation and point reset', async ({ page }) => {
  await page.unroute('https://tile.openstreetmap.org/**');
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#ddd"/></svg>' }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Place delivery pin' })).toBeEnabled();
  await page.getByRole('button', { name: 'Place delivery pin' }).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Confirm point' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('CONFIRMED COORDINATES', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'JSON response' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('dispatcher_confirmed');
  await page.getByRole('button', { name: 'Reset point' }).click();
  await expect(page.getByRole('button', { name: 'Place delivery pin' })).toBeVisible();
});

async function configureCloud(page: Page, failLookup = false) {
  let saved: unknown[] = [];
  const requests: string[] = [];
  const env: Record<string, string> = { WAKAPOINT_ALLOWED_ORIGINS: cloudOrigin, SUPABASE_URL: 'https://wakapoint-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'synthetic_server_key', NIPOST_API_KEY: 'nipost_test_synthetic_key' };
  const gateway = createGateway({
    env: name => env[name],
    fetch: (async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'synthetic-user' });
      if (String(url).includes('wakapoint_consume_limit')) return Response.json(true);
      if (String(url).includes('wakapoint_cache_get')) return Response.json(null);
      if (String(url).includes('wakapoint_cache_put')) return new Response(null, { status: 204 });
      return failLookup ? Response.json({ error: 'private upstream details' }, { status: 402 }) : Response.json({ data: { postcode: code, valid: true, owner: 'Private Owner', administrative_address: { state_name: 'FCT' } } });
    }) as typeof fetch,
  });
  await page.route('https://wakapoint-test.supabase.co/**', async route => {
    const request = route.request();
    const cors = { 'Access-Control-Allow-Origin': cloudOrigin, 'Access-Control-Allow-Headers': '*' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return; }
    if (request.url().includes('/auth/v1/signup')) {
      await route.fulfill({ json: { access_token: 'synthetic-user-access-token-123456789', refresh_token: 'synthetic-refresh', expires_in: 3600, user: { id: 'synthetic-user' } }, headers: cors }); return;
    }
    if (request.url().includes('/rest/v1/saved_addresses')) { await route.fulfill({ json: saved, headers: cors }); return; }
    if (request.url().includes('/rpc/save_wakapoint_library')) {
      const payload = request.postDataJSON() as { p_records: Array<Record<string, unknown>> };
      saved = payload.p_records.map(item => ({ ...item, saved_at: item.savedAt }));
      await route.fulfill({ status: 204, headers: cors }); return;
    }
    requests.push((await request.allHeaders()).authorization || '');
    const response = await gateway(new Request(request.url(), { method: 'POST', headers: await request.allHeaders(), body: request.postData() }));
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  return requests;
}

test('cloud session, library and authenticated postcode link flow through the gateway', async ({ page }) => {
  const requests = await configureCloud(page);
  await page.goto(cloudOrigin);
  await expect(page.locator('.connection-status')).toContainText('Cloud workspace');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await expect(page.locator('.connection-status')).toContainText('Cloud workspace');
  await page.getByRole('button', { name: /Saved addresses/ }).first().click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: /^Open/ }).click();
  await page.getByRole('button', { name: 'Postcode bridge', exact: true }).click();
  await page.getByLabel('NIPOST digital postcode').fill(code);
  await page.getByRole('button', { name: 'Verify with NIPOST' }).click();
  await expect(page.getByText('NIPOST confirmed this postcode exists.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Attach verified postcode' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Attach verified postcode' }).click();
  await page.getByRole('tab', { name: 'JSON response' }).click();
  await expect(page.getByRole('tabpanel')).toContainText(code);
  await expect(page.getByRole('tabpanel')).not.toContainText('Private Owner');
  expect(requests).toEqual(['Bearer synthetic-user-access-token-123456789']);
});

test('upstream failure stays actionable and cannot be attached as a verified code', async ({ page }) => {
  await configureCloud(page, true);
  await page.goto(cloudOrigin + '/#postcode');
  await page.getByLabel('NIPOST digital postcode').fill(code);
  await page.getByRole('button', { name: 'Verify with NIPOST' }).click();
  await expect(page.getByRole('alert')).toContainText('credits are insufficient');
  await expect(page.getByRole('button', { name: 'Attach verified postcode' })).toHaveCount(0);
});

test('editing a postcode cancels an in-flight lookup and discards its stale result', async ({ page }) => {
  await configureCloud(page);
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const requested = new Promise<void>(resolve => { started = resolve; });
  await page.route('**/functions/v1/wakapoint-gateway', async route => {
    started();
    await pending;
    await route.fulfill({ json: { data: { postcode: code, valid: true } }, headers: { 'Access-Control-Allow-Origin': cloudOrigin } }).catch(() => {});
  });
  await page.goto(cloudOrigin + '/#postcode');
  await page.getByLabel('NIPOST digital postcode').fill(code);
  await page.getByRole('button', { name: 'Verify with NIPOST' }).click();
  await requested;
  await page.getByLabel('NIPOST digital postcode').fill('FC-01-A01-KP-28');
  release();
  await expect(page.getByRole('button', { name: 'Verify with NIPOST' })).toBeEnabled();
  await expect(page.getByText('NIPOST confirmed this postcode exists.', { exact: false })).toHaveCount(0);
});
