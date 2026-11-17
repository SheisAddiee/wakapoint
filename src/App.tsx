import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import WorkspaceApp from './WorkspaceApp';
import { AuthFrame, AuthScreen } from './components/AuthScreen';
import { Onboarding } from './components/Onboarding';
import { loadGateway } from './lib/gateway';
import { getSupabase } from './lib/supabase';
import { readPreferences, type WorkspacePreferences } from './lib/onboarding';

const demoKey = 'wakapoint.demo.v1';
const demoPreferencesKey = 'wakapoint.demo.preferences.v1';
function readDemo() { try { return sessionStorage.getItem(demoKey) === 'true'; } catch { return false; } }
function readDemoPreferences() { try { return readPreferences(JSON.parse(sessionStorage.getItem(demoPreferencesKey) || 'null')); } catch { return null; } }

export default function App() {
  const [config] = useState(loadGateway);
  const [client] = useState(() => { try { return getSupabase(config); } catch { return null; } });
  const [session, setSession] = useState<Session | null>(null), [initializing, setInitializing] = useState(!!client);
  const [demo, setDemo] = useState(readDemo), [demoPreferences, setDemoPreferences] = useState(readDemoPreferences);
  const [error, setError] = useState(''), [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
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

  const preferences = demo ? demoPreferences : readPreferences(session?.user.user_metadata?.wakapoint);
  const startDemo = () => { try { sessionStorage.setItem(demoKey, 'true'); } catch { /* A demo still works in memory. */ } setDemo(true); setError(''); };
  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      if (!demo && client) { const { error: authError } = await client.auth.signOut({ scope: 'local' }); if (authError) throw authError; }
      try { sessionStorage.removeItem(demoKey); } catch { /* Storage may be unavailable. */ }
      setDemo(false); if (!demo) setSession(null); setError(''); location.hash = ''; 
    } catch { setError('Sign-out could not finish. Check your connection and retry.'); }
    finally { setLeaving(false); }
  };
  const complete = async (value: WorkspacePreferences) => {
    if (demo) {
      try { sessionStorage.setItem(demoPreferencesKey, JSON.stringify(value)); } catch { /* Setup can live in memory. */ }
      location.hash = value.firstTask; setDemoPreferences(value);
    } else if (client && session) {
      const { data, error: authError } = await client.auth.updateUser({ data: { wakapoint: value } });
      if (authError || !data.user) throw authError || new Error('Setup did not save.');
      location.hash = value.firstTask; setSession({ ...session, user: data.user });
    }
  };

  if (initializing) return <AuthFrame><div className="auth-loading" role="status"><span className="auth-eyebrow">WAKAPOINT</span><p>Opening your workspace…</p></div></AuthFrame>;
  if (!session && !demo) return <AuthScreen client={client} onDemo={startDemo} initialError={error}/>;
  if (!preferences) return <Onboarding demo={demo} onComplete={complete} onBack={() => { void leave(); }}/>;
  return <><WorkspaceApp key={demo ? 'demo' : session!.user.id} gatewayConfig={demo ? { url: '', publicKey: '' } : config} preferences={preferences} demo={demo} accountLabel={demo ? 'Demo workspace' : session?.user.email || 'WakaPoint account'} onSignOut={() => void leave()} signingOut={leaving}/>{error && <div className="account-error" role="alert">{error}<button className="auth-text-button" onClick={() => setError('')}>Dismiss</button></div>}</>;
}
