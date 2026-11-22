import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import WorkspaceApp from './WorkspaceApp';
import { AuthFrame, AuthScreen } from './components/AuthScreen';
import { Onboarding } from './components/Onboarding';
import { loadGateway } from './lib/gateway';
import { getSupabase } from './lib/supabase';
import { readPreferences, type WorkspacePreferences } from './lib/onboarding';
import { Toaster, toast } from 'sonner';
import { WorkspaceTutorial } from './components/WorkspaceTutorial';
import { LandingPage } from './components/LandingPage';
import { ThemeProvider, useTheme } from './components/ThemeToggle';
import { readPreviewSession, signInPreview, signOutPreview, updatePreviewSession } from './lib/previewAccount';

function AppContent() {
  const [publicPage, setPublicPage] = useState(() => location.hash.slice(1));
  const { theme, setTheme } = useTheme();
  const themeAccount = useRef('');
  const syncingTheme = useRef(false);
  const accountEpoch = useRef(0);
  const activeAccount = useRef<string | null>(null);
  const [config] = useState(loadGateway);
  const [client] = useState(() => { try { return getSupabase(config); } catch { return null; } });
  const previewAuth = !config.url && !config.publicKey && import.meta.env.VITE_ENABLE_PREVIEW_AUTH !== 'false';
  const [session, setSession] = useState<Pick<Session, 'user'> | null>(() => previewAuth ? readPreviewSession() : null), [initializing, setInitializing] = useState(!!client);
  const [tutorialDismissed, setTutorialDismissed] = useState(false), [tutorialRequested, setTutorialRequested] = useState(false);
  const [error, setError] = useState(''), [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const acceptSession = (next: Session | null) => {
      if (cancelled) return;
      const accepted = next?.user.is_anonymous ? null : next;
      const id = accepted?.user.id || null;
      if (activeAccount.current !== id) {
        accountEpoch.current += 1;
        activeAccount.current = id;
        setTutorialDismissed(false); setTutorialRequested(false);
      }
      setSession(accepted);
    };
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (_event === 'SIGNED_OUT') toast.dismiss();
      acceptSession(next);
    });
    client.auth.getSession().then(({ data, error: authError }) => {
      if (cancelled) return;
      acceptSession(data.session);
      const url = new URL(location.href);
      if (authError || url.searchParams.has('error')) setError('Sign-in could not be completed. Please try email or Google again.');
      ['code','error','error_code','error_description'].forEach(key => url.searchParams.delete(key));
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }).catch(() => { if (!cancelled) setError('Your session could not be restored. Please sign in again.'); }).finally(() => { if (!cancelled) setInitializing(false); });
    return () => { cancelled = true; accountEpoch.current += 1; subscription.unsubscribe(); };
  }, [client]);
  useEffect(() => { const sync = () => setPublicPage(location.hash.slice(1)); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  useEffect(() => {
    if (!session) { themeAccount.current = ''; syncingTheme.current = false; return; }
    syncingTheme.current = false;
    const saved = session.user.user_metadata?.wakapoint_theme;
    themeAccount.current = `${session.user.id}:${saved === 'light' || saved === 'dark' ? saved : theme}`;
    if ((saved === 'light' || saved === 'dark') && saved !== theme) { syncingTheme.current = true; setTheme(saved); }
  }, [session?.user.id]);
  useEffect(() => {
    if (previewAuth && session) { updatePreviewSession(session, { wakapoint_theme: theme }); return; }
    if (!session || !client || !themeAccount.current) return;
    if (syncingTheme.current) {
      if (theme === session.user.user_metadata?.wakapoint_theme) syncingTheme.current = false;
      return;
    }
    const next = `${session.user.id}:${theme}`;
    if (themeAccount.current === next) return;
    themeAccount.current = next;
    let cancelled = false;
    client.auth.updateUser({ data: { wakapoint_theme: theme } }).then(({ error: syncError }) => { if (syncError && !cancelled) toast.info('Theme saved on this device. Account sync is unavailable.'); }).catch(() => { if (!cancelled) toast.info('Theme saved on this device. Account sync is unavailable.'); });
    return () => { cancelled = true; };
  }, [theme, session?.user.id, client]);

  const preferences = useMemo(() => readPreferences(session?.user.user_metadata?.wakapoint), [session?.user.user_metadata?.wakapoint]);
  const openTutorial = useCallback(() => setTutorialRequested(true), []);
  const leave = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      if (client) { const { error: authError } = await client.auth.signOut({ scope: 'local' }); if (authError) throw authError; }
      else if (previewAuth) signOutPreview();
      setSession(null); setTutorialDismissed(false); setTutorialRequested(false); setError(''); location.hash = ''; toast.success('You are signed out.');
    } catch { setError('Sign-out could not finish. Check your connection and retry.'); }
    finally { setLeaving(false); }
  }, [client, leaving, previewAuth]);
  const complete = async (value: WorkspacePreferences) => {
    if (previewAuth && session) { setSession(updatePreviewSession(session, { wakapoint: value })); location.hash = value.firstTask; toast.success('Your preview workspace is ready.'); return; }
    if (client && session) {
      const epoch = accountEpoch.current;
      const { data, error: authError } = await client.auth.updateUser({ data: { wakapoint: value } });
      if (epoch !== accountEpoch.current) return;
      if (authError || !data.user) throw authError || new Error('Setup did not save.');
      location.hash = value.firstTask; toast.success('Your workspace is ready.');
    }
  };
  const finishTutorial = async (outcome: 'complete' | 'skipped') => {
    setTutorialDismissed(true); setTutorialRequested(false);
    if (outcome === 'complete') toast.success('You are ready to resolve your first address.');
    else toast.info('Tutorial skipped. You can reopen it from Help anytime.');
    if (previewAuth && session && preferences) { setSession(updatePreviewSession(session, { wakapoint: { ...preferences, tutorial: outcome } })); return; }
    if (client && session && preferences) {
      const epoch = accountEpoch.current;
      try {
        const { error: saveError } = await client.auth.updateUser({ data: { wakapoint: { ...preferences, tutorial: outcome } } });
        if (saveError && epoch === accountEpoch.current) toast.info('Your tutorial preference could not sync. You can keep working.');
      } catch { if (epoch === accountEpoch.current) toast.info('Your tutorial preference could not sync. You can keep working.'); }
    }
  };

  if (initializing) return <AuthFrame><div className="auth-loading" role="status"><div className="session-loader-mark" aria-hidden="true"><span/></div><span className="auth-eyebrow">WAKAPOINT</span><p>Opening your workspace…</p><div className="session-loader-lines" aria-hidden="true"><span/><span/><span/></div></div></AuthFrame>;
  if (publicPage === 'home' || (!session && !publicPage && !error)) return <LandingPage signedIn={!!session} onStart={() => { location.hash = 'signup'; }} onSignIn={() => { location.hash = 'signin'; }} onWorkspace={() => { location.hash = 'resolve'; }}/>;
  if (!session) return <AuthScreen key={publicPage === 'signin' ? 'signin' : 'signup'} initialMode={publicPage === 'signin' ? 'signin' : 'signup'} client={client} initialError={error} onPreviewSignIn={previewAuth ? email => { const next = signInPreview(email); accountEpoch.current += 1; activeAccount.current = next.user.id; setSession(next); setTutorialDismissed(false); setTutorialRequested(false); setError(''); location.hash = 'resolve'; } : undefined}/>;
  if (!preferences) return <Onboarding onComplete={complete} onBack={() => { void leave(); }}/>;
  return <><WorkspaceApp key={session.user.id} gatewayConfig={config} preferences={preferences} previewAccountId={previewAuth ? session.user.id : undefined} accountLabel={session.user.email || 'WakaPoint account'} onSignOut={leave} signingOut={leaving} onTutorial={openTutorial}/><WorkspaceTutorial open={tutorialRequested || (!preferences.tutorial && !tutorialDismissed)} onFinish={finishTutorial}/>{error && <div className="account-error" role="alert">{error}<button className="auth-text-button" onClick={() => setError('')}>Dismiss</button></div>}</>;
}

export default function App() {
  return <ThemeProvider><AppContent/><GlobalToasts/></ThemeProvider>;
}
function GlobalToasts() { const { theme } = useTheme(); return <Toaster theme={theme} position="bottom-right" closeButton toastOptions={{ className: 'wp-toast' }}/>; }
