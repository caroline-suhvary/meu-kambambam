import { browserClient } from '@/lib/browser';
// O token acompanha a requisição; a API o revalida antes de acessar dados privados.
export async function request<T>(action:string,payload:Record<string,unknown>={}):Promise<T> {
 const {data}=await browserClient().auth.getSession();
 const response=await fetch('/api/kambambam',{method:'POST',headers:{'Content-Type':'application/json',...(data.session?{Authorization:`Bearer ${data.session.access_token}`}:{})},body:JSON.stringify({action,...payload})});
 const result=await response.json();
 if(!response.ok) throw new Error(result.error ?? 'Não foi possível concluir.');
 return result as T;
}
