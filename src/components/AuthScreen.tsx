import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Navigation2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Modal } from './WorkspacePrimitives';
import { ThemeToggle } from './ThemeToggle';
import { SpecularButton } from './reactbits/SpecularButton';

export function AuthFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return <div className="auth-shell"><header className="auth-header"><a className="auth-brand" href="#" aria-label="WakaPoint home"><Navigation2 size={25} strokeWidth={1.5}/><span>WakaPoint<span>.</span></span></a><span className="auth-header-note">A way forward for every address</span><ThemeToggle/></header><main className="auth-main">{children}</main><footer className="auth-footer">{footer || <><span>Nigeria, in your own words.</span><span>Built for the last mile.</span></>}</footer></div>;
}

function GoogleMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92A6 6 0 0 1 6.1 12c0-.67.12-1.32.3-1.92V7.49H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.51l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z"/></svg>;
}

function authMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'otp_expired') return 'That code is invalid or expired. Check your email or request a new code.';
  if (code.includes('rate_limit') || code === 'over_email_send_rate_limit') return 'Too many attempts. Please wait a minute before trying again.';
  if (code === 'provider_disabled') return 'Google sign-in is not available yet. Please continue with email.';
  return 'We could not complete sign-in. Check your connection and try again.';
}

export function AuthScreen({ client, initialError = '', initialMode = 'signup' }: { client: SupabaseClient | null; initialError?: string; initialMode?: 'signup' | 'signin' }) {
  const [email, setEmail] = useState(''), [sentTo, setSentTo] = useState(''), [token, setToken] = useState('');
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode), [busy, setBusy] = useState<'email' | 'google' | 'verify' | null>(null);
  const [error, setError] = useState(initialError), [privacyOpen, setPrivacyOpen] = useState(false), [resendAt, setResendAt] = useState(0), [seconds, setSeconds] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!resendAt) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update(); const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);
  useEffect(() => { if (sentTo) codeRef.current?.focus(); }, [sentTo]);

  const sendCode = async (destination = email.trim()) => {
    if (!client) { setError('Account sign-in is unavailable. Please contact your workspace administrator.'); return; }
    setBusy('email'); setError('');
    try {
      const { error: authError } = await client.auth.signInWithOtp({ email: destination, options: { shouldCreateUser: mode === 'signup', emailRedirectTo: location.origin + location.pathname } });
      if (authError) throw authError;
      if (mounted.current) { setSentTo(destination); toast.success('Verification code sent. Check your inbox.'); setToken(''); setResendAt(Date.now() + 60000); }
    } catch (err) { if (mounted.current) setError(authMessage(err)); }
    finally { if (mounted.current) setBusy(null); }
  };
  const verify = async () => {
    if (!client) return;
    setBusy('verify'); setError('');
    try { const { error: authError } = await client.auth.verifyOtp({ email: sentTo, token, type: 'email' }); if (authError) throw authError; }
    catch (err) { if (mounted.current) setError(authMessage(err)); }
    finally { if (mounted.current) setBusy(null); }
  };
  const google = async () => {
    if (!client) { setError('Account sign-in is unavailable. Please contact your workspace administrator.'); return; }
    setBusy('google'); setError('');
    try { const { error: authError } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); if (authError) throw authError; }
    catch (err) { if (mounted.current) { setError(authMessage(err)); setBusy(null); } }
  };

  return <AuthFrame><section className="auth-content" aria-label="WakaPoint account"><div className="auth-emblem"><Navigation2 size={42} strokeWidth={1.1}/></div>{sentTo ? <><div className="auth-intro"><span className="auth-eyebrow">ONE STEP CLOSER</span><h1>Check your inbox.</h1><p>Enter the verification code sent to<br/><strong>{sentTo}</strong></p></div><form className="auth-form" onSubmit={e => { e.preventDefault(); void verify(); }}><label htmlFor="email-code">Verification code</label><input ref={codeRef} id="email-code" className="auth-code" inputMode="numeric" autoComplete="one-time-code" value={token} onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0,8)); setError(''); }} maxLength={8} placeholder="Enter your code" required minLength={6} aria-invalid={!!error} aria-describedby={error ? 'auth-error' : 'code-help'}/><span id="code-help" className="auth-field-note">Use the most recent code. Check spam if it hasn't arrived.</span><SpecularButton className="button primary auth-submit" disabled={!!busy || token.length < 6} type="submit">{busy === 'verify' ? 'Verifying…' : 'Verify email'}<ArrowRight size={17}/></SpecularButton></form><div className="auth-code-actions"><button className="auth-text-button" disabled={!!busy || seconds > 0} onClick={() => void sendCode(sentTo)}>{busy === 'email' ? 'Sending…' : seconds ? `Resend code in ${seconds}s` : 'Resend code'}</button><button className="auth-text-button" disabled={!!busy} onClick={() => { setSentTo(''); setToken(''); setError(''); }}><ArrowLeft size={13}/>Use a different email</button></div></> : <><div className="auth-intro"><span className="auth-eyebrow">YOUR LAST-MILE WORKSPACE</span><h1>{mode === 'signup' ? <>Good directions.<br/>Better deliveries.</> : <>Welcome back.<br/>Let's find the way.</>}</h1><p>{mode === 'signup' ? 'A clearer path, from the first landmark to the last mile.' : 'Your addresses and your next delivery are waiting.'}</p></div><button className="button secondary auth-google" disabled={!!busy} onClick={() => void google()}><GoogleMark/>{busy === 'google' ? 'Connecting to Google…' : 'Continue with Google'}</button><div className="auth-divider"><span/>or<span/></div><form className="auth-form" onSubmit={e => { e.preventDefault(); void sendCode(); }}><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="go" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" maxLength={254} required disabled={!!busy} aria-invalid={!!error} aria-describedby={error ? 'auth-error' : undefined}/><SpecularButton className="button primary auth-submit" disabled={!!busy || !email.trim()} type="submit">{busy === 'email' ? 'Sending your code…' : 'Continue with email'}<ArrowRight size={17}/></SpecularButton></form><p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to WakaPoint?'} <button className="auth-text-button" disabled={!!busy} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p></>}{error && <p className="auth-error" id="auth-error" role="alert">{error}</p>}<p className="auth-privacy">Your email is used to sign in. Your address library belongs to you. <button className="auth-text-button" onClick={() => setPrivacyOpen(true)}>How we handle your data</button></p></section><Modal open={privacyOpen} onOpenChange={setPrivacyOpen} title="Your data, with a clear purpose"><p className="dialog-description">Supabase stores your account email and authenticates sign-in. Google sign-in shares basic profile details and email with the authentication service.</p><div className="help-steps"><div><ShieldCheck size={19}/><div><strong>Your address library is private</strong><p>Cloud records are restricted to your authenticated account. Contact patterns are filtered before saving, and a review is still required.</p></div></div><div><Check size={19}/><div><strong>Access requires your account</strong><p>Sign in to access your private library. Cloud records stay on your account when you sign out. Sessions are cleared from this browser.</p></div></div></div><button className="button primary" onClick={() => setPrivacyOpen(false)}>Got it</button></Modal></AuthFrame>;
}
