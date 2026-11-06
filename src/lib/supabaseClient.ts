import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or local storage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const saved = localStorage.getItem('epoting_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return {
    url: envUrl && !envUrl.includes('your-project-ref') ? envUrl : '',
    anonKey: envAnonKey && !envAnonKey.includes('your-anon-key') ? envAnonKey : '',
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem('epoting_supabase_config', JSON.stringify({ url, anonKey }));
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSavedSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSavedSupabaseConfig();
  return Boolean(url && anonKey);
}
