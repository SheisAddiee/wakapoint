import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readPreviewSession, signInPreview, signOutPreview, updatePreviewSession } from '../src/lib/previewAccount';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });
afterEach(() => values.clear());

test('temporary email entry creates a reloadable preview without a server token', () => {
  const session = signInPreview('  Any.Person@example.com  ');
  assert.equal(session.user.email, 'any.person@example.com');
  assert.equal(session.user.app_metadata.provider, 'preview');
  assert.equal('access_token' in session, false);
  assert.equal(readPreviewSession()?.user.id, session.user.id);
  assert.throws(() => signInPreview('not an email'));
});

test('preview setup and themes survive sign-out and remain isolated by email', () => {
  const alice = signInPreview('alice@example.com');
  updatePreviewSession(alice, { wakapoint: { version: 1, role: 'merchant', city: 'Abuja', firstTask: 'batch', tutorial: 'skipped' }, wakapoint_theme: 'light' });
  signOutPreview();
  assert.equal(readPreviewSession(), null);
  const bob = signInPreview('bob@example.com');
  assert.notEqual(bob.user.id, alice.user.id);
  assert.deepEqual(bob.user.user_metadata, {});
  const restored = signInPreview('alice@example.com');
  assert.equal(restored.user.user_metadata.wakapoint.role, 'merchant');
  assert.equal(restored.user.user_metadata.wakapoint.tutorial, 'skipped');
  assert.equal(restored.user.user_metadata.wakapoint_theme, 'light');
});

test('corrupted preview metadata cannot create privileges or a phantom session', () => {
  const session = signInPreview('alice@example.com');
  updatePreviewSession(session, { admin: true, role: 'admin', wakapoint_theme: 'invalid' });
  assert.deepEqual(readPreviewSession()?.user.user_metadata, {});
  values.set('wakapoint.preview.account.alice@example.com', '{broken');
  assert.deepEqual(readPreviewSession()?.user.user_metadata, {});
  values.set('wakapoint.preview.active', 'invalid');
  assert.equal(readPreviewSession(), null);
});
