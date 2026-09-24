import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});

// ─────────────────────────────────────
// WORKER API helper — calls Railway
// ─────────────────────────────────────
const workerUrl = import.meta.env.VITE_WORKER_URL;
const workerSecret = import.meta.env.VITE_WORKER_SECRET;

export async function workerFetch(path, options = {}) {
  const res = await fetch(`${workerUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-worker-secret': workerSecret,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Worker request failed');
  }
  return res.json();
}
