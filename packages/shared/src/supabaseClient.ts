import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Cada app (musico/admin) define essas duas variáveis no seu próprio .env
// (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY), apontando pro mesmo
// projeto Supabase — são as duas apps compartilhando o mesmo backend.
export function createSupabaseClient(url: string, publishableKey: string) {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env do app.'
    );
  }
  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
