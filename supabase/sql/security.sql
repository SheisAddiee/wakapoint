-- The platform-created event trigger should not be exposed as a Data API RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
