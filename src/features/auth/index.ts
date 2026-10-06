import { browserClient } from '@/lib/browser';
// AuthForm -> função de autenticação -> serviço Auth -> sessão -> página principal.
export async function signIn(email:string,password:string) {
 const {error}=await browserClient().auth.signInWithPassword({email,password});
 if(error) throw error;
}
export async function signUp(name:string,email:string,password:string) {
 const {data,error}=await browserClient().auth.signUp({email,password,options:{data:{name},emailRedirectTo:window.location.origin}});
 if(error) throw error;
 return data.session;
}
export async function signOut() { const {error}=await browserClient().auth.signOut();if(error) throw error; }
export async function requestRecovery(email:string) {
 const {error}=await browserClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});
 if(error) throw error;
}
