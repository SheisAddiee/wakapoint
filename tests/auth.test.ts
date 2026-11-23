import test from 'node:test';
import assert from 'node:assert/strict';
import { accountRoute, callbackFailed, cleanCallbackUrl, emailCallback } from '../src/lib/auth';

test('account aliases preserve signup, sign-in and dashboard intent', () => {
  assert.equal(accountRoute(new URL('https://wakapoint.vercel.app/signup')), 'signup');
  assert.equal(accountRoute(new URL('https://wakapoint.vercel.app/login')), 'signin');
  assert.equal(accountRoute(new URL('https://wakapoint.vercel.app/dashboard')), 'resolve');
  assert.equal(accountRoute(new URL('https://wakapoint.vercel.app/#batch')), 'batch');
});
test('email callbacks validate type and token and strip credentials from history', () => {
  const url = new URL(`https://wakapoint.vercel.app/auth/callback?token_hash=${'a'.repeat(56)}&type=email`);
  assert.equal(emailCallback(url)?.type, 'email');
  assert.equal(cleanCallbackUrl(url), '/#signin');
  assert.throws(() => emailCallback(new URL('https://wakapoint.vercel.app/?token_hash=bad&type=email')));
  assert.throws(() => emailCallback(new URL(`https://wakapoint.vercel.app/?token_hash=${'a'.repeat(56)}&type=admin`)));
  assert.equal(cleanCallbackUrl(new URL('https://wakapoint.vercel.app/?code=secret#saved')), '/#saved');
  assert.equal(cleanCallbackUrl(new URL('https://wakapoint.vercel.app/#access_token=secret&refresh_token=secret')), '/');
  assert.equal(callbackFailed(new URL('https://wakapoint.vercel.app/#error=access_denied')), true);
});
