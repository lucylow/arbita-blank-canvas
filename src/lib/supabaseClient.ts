import { createClient } from '@supabase/supabase-js';

// Prefer Vite env; fall back to project id; final fallback to baked-in project
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'oyjtrtdncwqyuqqsapmx';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anRydGRuY3dxeXVxcXNhcG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDg2OTAsImV4cCI6MjA3Nzc4NDY5MH0.oxmgjM2e_VN_IO-6mKl3CNUtMFZkKvd276waFQL4Fuc';

if (!import.meta.env.VITE_SUPABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_SUPABASE_URL not set; using derived URL:', SUPABASE_URL);
}
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('VITE_SUPABASE_PUBLISHABLE_KEY not set; using baked-in anon key');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
