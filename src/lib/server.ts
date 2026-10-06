import { createClient } from '@supabase/supabase-js';
// Este arquivo só é importado pela API. A chave secreta não é enviada à tela.
export function adminClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SECRET_KEY;
 if (!url || !key) throw new Error('Configure as variáveis de servidor em .env.local.');
 return createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
}
