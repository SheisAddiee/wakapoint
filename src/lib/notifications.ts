import type { SupabaseClient } from '@supabase/supabase-js';

export interface WorkspaceNotification {
  id: string;
  kind: 'welcome' | 'address_saved';
  title: string;
  body: string;
  action: 'resolve' | 'saved';
  created_at: string;
  read_at: string | null;
}

export async function loadNotifications(client: SupabaseClient, before?: { time: string; id: string }) {
  let query = client.from('notifications').select('id,kind,title,body,action,created_at,read_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(20).retry(false);
  if (before) query = query.or(`created_at.lt.${before.time},and(created_at.eq.${before.time},id.lt.${before.id})`);
  const { data, error } = await query;
  if (error) throw new Error('Your notifications could not load. Please retry.');
  return (data || []) as WorkspaceNotification[];
}

export async function unreadNotificationCount(client: SupabaseClient) {
  const { count, error } = await client.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null).retry(false);
  if (error) throw new Error('Notifications are temporarily unavailable.');
  return count || 0;
}

export async function markNotificationsRead(client: SupabaseClient, id?: string) {
  let query = client.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null).retry(false);
  if (id) query = query.eq('id', id);
  const { error } = await query;
  if (error) throw new Error('The read status could not save. Please retry.');
}
