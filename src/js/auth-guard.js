import { supabase } from './supabase-config.js';

export async function requireAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    window.location.href = '/src/pages/login.html';
    return null;
  }
  return session;
}