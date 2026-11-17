import { useEffect, useRef, useState } from 'react';
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

function AppContent() {
  const [publicPage, setPublicPage] = useState(() => location.hash.slice(1));
  const { theme, setTheme } = useTheme();
  const themeAccount = useRef('');
  const syncingTheme = useRef(false);
  const [config] = useState(loadGateway);
  const [client] = useState(() => { try { return getSupabase(config); } catch { return null; } });
  const [session, setSession] = useState<Session | null>(null), [initializing, setInitializing] = useState(!!client);
  const [tutorialDismissed, setTutorialDismissed] = useState(false), [tutorialRequested, setTutorialRequested] = useState(false);
  const [error, setError] = useState(''), [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (_event === 'SIGNED_OUT') toast.dismiss();
      if (!cancelled) setSession(next?.user.is_anonymous ? null : next);
    });
    client.auth.getSession().then(({ data, error: authError }) => {
      if (cancelled) return;
      setSession(data.session?.user.is_anonymous ? null : data.session);
      const url = new URL(location.href);
      if (authError || url.searchParams.has('error')) setError('Sign-in could not be completed. Please try email or Google again.');
      ['code','error','error_code','error_description'].forEach(key => url.searchParams.delete(key));
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }).catch(() => { if (!cancelled) setError('Your session could not be restored. Please sign in again.'); }).finally(() => { if (!cancelled) setInitializing(false); });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [client]);
  useEffect(() => { const sync = () => setPublicPage(location.hash.slice(1)); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  useEffect(() => {
    if (!session) { themeAccount.current = ''; return; }
    const saved = session.user.user_metadata?.wakapoint_theme;
    themeAccount.current = `${session.user.id}:${saved === 'light' || saved === 'dark' ? saved : theme}`;
    if ((saved === 'light' || saved === 'dark') && saved !== theme) { syncingTheme.current = true; setTheme(saved); }
  }, [session?.user.id]);
  useEffect(() => {
    if (!session || !client || !themeAccount.current) return;
    if (syncingTheme.current) {
      if (theme === session.user.user_metadata?.wakapoint_theme) syncingTheme.current = false;
      return;
    }
    const next = `${session.user.id}:${theme}`;
    if (themeAccount.current === next) return;
    themeAccount.current = next;
    client.auth.updateUser({ data: { wakapoint_theme: theme } }).then(({ error: syncError }) => { if (syncError) toast.info('Theme saved on this device. Account sync is unavailable.'); }).catch(() => toast.info('Theme saved on this device. Account sync is unavailable.'));
  }, [theme, session?.user.id, client]);

  const preferences = readPreferences(session?.user.user_metadata?.wakapoint);
  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      if (client) { const { error: authError } = await client.auth.signOut({ scope: 'local' }); if (authError) throw authError; }
      setSession(null); setTutorialDismissed(false); setTutorialRequested(false); setError(''); location.hash = ''; toast.success('You are signed out.');
    } catch { setError('Sign-out could not finish. Check your connection and retry.'); }
    finally { setLeaving(false); }
  };
  const complete = async (value: WorkspacePreferences) => {
    if (client && session) {
      const { data, error: authError } = await client.auth.updateUser({ data: { wakapoint: value } });
      if (authError || !data.user) throw authError || new Error('Setup did not save.');
      location.hash = value.firstTask; setSession({ ...session, user: data.user }); toast.success('Your workspace is ready.');
    }
  };
  const finishTutorial = async (outcome: 'complete' | 'skipped') => {
    setTutorialDismissed(true); setTutorialRequested(false);
    if (outcome === 'complete') toast.success('You are ready to resolve your first address.');
    else toast.info('Tutorial skipped. You can reopen it from Help anytime.');
    if (client && session && preferences) {
      const { data, error: saveError } = await client.auth.updateUser({ data: { wakapoint: { ...preferences, tutorial: outcome } } });
      if (saveError) toast.info('Your tutorial preference could not sync. You can keep working.');
      else if (data.user) setSession({ ...session, user: data.user });
    }
  };

  if (initializing) return <AuthFrame><div className="auth-loading" role="status"><span className="auth-eyebrow">WAKAPOINT</span><p>Opening your workspace…</p></div></AuthFrame>;
  if (publicPage === 'home' || (!session && !publicPage && !error)) return <LandingPage signedIn={!!session} onStart={() => { location.hash = 'signup'; }} onSignIn={() => { location.hash = 'signin'; }} onWorkspace={() => { location.hash = 'resolve'; }}/>;
  if (!session) return <AuthScreen key={publicPage === 'signin' ? 'signin' : 'signup'} initialMode={publicPage === 'signin' ? 'signin' : 'signup'} client={client} initialError={error}/>;
  if (!preferences) return <Onboarding onComplete={complete} onBack={() => { void leave(); }}/>;
  return <><WorkspaceApp key={session.user.id} gatewayConfig={config} preferences={preferences} accountLabel={session.user.email || 'WakaPoint account'} onSignOut={() => void leave()} signingOut={leaving} onTutorial={() => setTutorialRequested(true)}/><WorkspaceTutorial open={tutorialRequested || (!preferences.tutorial && !tutorialDismissed)} onFinish={finishTutorial}/>{error && <div className="account-error" role="alert">{error}<button className="auth-text-button" onClick={() => setError('')}>Dismiss</button></div>}</>;
}

export default function App() {
  return <ThemeProvider><AppContent/><GlobalToasts/></ThemeProvider>;
}
function GlobalToasts() { const { theme } = useTheme(); return <Toaster theme={theme} position="bottom-right" closeButton toastOptions={{ className: 'wp-toast' }}/>; }
