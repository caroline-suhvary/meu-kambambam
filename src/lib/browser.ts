import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// Um cliente por aba. Somente URL e chave pública podem chegar ao navegador.
let client: SupabaseClient | undefined;
export function browserClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if (!url || !key) throw new Error('Preencha .env.local e reinicie npm run dev.');
 if (!client) client = createClient(url, key);
 return client;
}
