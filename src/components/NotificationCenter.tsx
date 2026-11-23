import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowRight, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Modal } from './WorkspacePrimitives';
import { loadNotifications, markNotificationsRead, unreadNotificationCount, type WorkspaceNotification } from '../lib/notifications';
import './notifications.css';

export function NotificationCenter({ client, revision }: { client: SupabaseClient | null; revision: number }) {
  const [open, setOpen] = useState(false), [unread, setUnread] = useState(0);
  const [items, setItems] = useState<WorkspaceNotification[]>([]), [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const generation = useRef(0), fetching = useRef(false), marking = useRef(false);
  useEffect(() => () => { generation.current += 1; }, []);
  const refresh = useCallback(async (append = false) => {
    if (!client || fetching.current) return;
    fetching.current = true; setLoading(true); setError('');
    const epoch = generation.current;
    try {
      const last = append ? items.at(-1) : undefined;
      const [rows, count] = await Promise.all([loadNotifications(client, last ? { time: last.created_at, id: last.id } : undefined), unreadNotificationCount(client)]);
      if (epoch !== generation.current) return;
      setItems(current => append ? [...current, ...rows.filter(row => !current.some(existing => existing.id === row.id))] : rows);
      setUnread(count); setMore(rows.length === 20);
    } catch { if (epoch === generation.current) setError('Your notifications could not load. Please retry.'); }
    finally { fetching.current = false; if (epoch === generation.current) setLoading(false); }
  }, [client, items]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false, checking = false;
    const check = async () => {
      if (document.hidden || checking) return;
      checking = true;
      try { const count = await unreadNotificationCount(client); if (!cancelled) setUnread(count); }
      catch { /* Keep the last known badge count. Opening the inbox exposes errors and retry. */ }
      finally { checking = false; }
    };
    void check();
    const interval = window.setInterval(check, 60000);
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [client, revision]);

  const markRead = async (id?: string, action?: WorkspaceNotification['action']) => {
    if (!client || marking.current) return;
    marking.current = true; setSaving(true); setError('');
    const epoch = generation.current;
    try {
      await markNotificationsRead(client, id);
      if (epoch !== generation.current) return;
      setItems(current => current.map(item => !id || item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
      if (action) { setOpen(false); location.hash = action; }
      const count = await unreadNotificationCount(client);
      if (epoch === generation.current) setUnread(count);
    } catch (err) { if (epoch === generation.current) setError((err as Error).message); }
    finally { marking.current = false; if (epoch === generation.current) setSaving(false); }
  };

  return <><button className="icon-button notification-trigger" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} onClick={() => { setOpen(true); void refresh(); }}><Bell size={18}/>{unread > 0 && <span className="notification-badge" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}</button><Modal open={open} onOpenChange={setOpen} title="Your notifications"><p className="dialog-description">Account updates and activity in your private workspace.</p>{!client ? <p className="dialog-description">Your local preview does not receive cloud notifications.</p> : <><div className="notification-toolbar"><button className="button secondary small" disabled={loading || saving} onClick={() => void refresh()}><RefreshCw size={14}/>Refresh</button><button className="button secondary small" disabled={!unread || loading || saving} onClick={() => void markRead()}><CheckCheck size={14}/>{saving ? 'Saving…' : 'Mark all read'}</button></div>{error && <p className="auth-error" role="alert">{error}</p>}{loading && <p role="status" className="dialog-description">Loading notifications…</p>}{!loading && !error && items.length === 0 && <div className="notification-empty"><Bell size={24}/><strong>You’re all caught up.</strong><p>New account and library updates will appear here.</p></div>}<ul className="notification-list">{items.map(item => <li key={item.id} className={item.read_at ? '' : 'is-unread'}><button disabled={saving} onClick={() => void markRead(item.id, item.action)}><span className="notification-heading"><strong>{item.title}</strong>{!item.read_at && <span className="notification-dot" aria-label="Unread"/>}</span><span>{item.body}</span><span className="notification-meta"><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time><ArrowRight size={14}/></span></button></li>)}</ul>{more && <button className="button secondary" disabled={loading || saving} onClick={() => void refresh(true)}>Load older notifications</button>}</>}</Modal></>;
}
