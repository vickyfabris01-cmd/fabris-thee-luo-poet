import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Supabase environment variables not configured. Using fallback mode.');
  console.warn('Add these to your .env file:');
  console.warn('VITE_SUPABASE_URL=your_supabase_url');
  console.warn('VITE_SUPABASE_ANON_KEY=your_anon_key');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('✓ Supabase connected');
    return true;
  } catch (e) {
    console.error('Supabase connection failed:', e.message);
    return false;
  }
}
