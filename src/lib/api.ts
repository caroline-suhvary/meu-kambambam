import type { NextRequest } from 'next/server';
import { adminClient } from './server';
// Nunca confiamos no UUID enviado pela tela. getUser revalida o token no Auth.
export async function apiContext(request:NextRequest) {
 const expected=process.env.APP_ORIGIN;
 const origin=request.headers.get('origin');
 if(!expected || origin!==new URL(expected).origin) throw new Error('Origem da requisição não permitida. Configure APP_ORIGIN.');
 const client=adminClient();
 const header=request.headers.get('authorization');
 let actor:string|null=null;
 if(header){
  if(!header.startsWith('Bearer ')) throw new Error('Sessão inválida.');
  const {data,error}=await client.auth.getUser(header.slice(7));
  if(error || !data.user) throw new Error('Sessão expirada. Entre novamente.');
  actor=data.user.id;
  const name=typeof data.user.user_metadata.name==='string'?data.user.user_metadata.name:'Usuário';
  const {error:profileError}=await client.rpc('kambambam_preparar_perfil',{uid:actor,nome:name});
  if(profileError) throw new Error(profileError.message);
 }
 async function operate<T>(action:string,payload:Record<string,unknown>):Promise<T>{
  const {data,error}=await client.rpc('kambambam_operar',{actor,action,payload});
  if(error) throw new Error(error.code==='23505'?'Este registro já existe. Cada pessoa cria só um quadro de cada tipo.':error.message);
  return data as T;
 }
 return {client,actor,operate};
}
export function apiFailure(error:unknown){return Response.json({error:error instanceof Error?error.message:'Falha inesperada.'},{status:400});}
