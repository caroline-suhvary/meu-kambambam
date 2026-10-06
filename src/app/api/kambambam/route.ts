import type { NextRequest } from 'next/server';
import { apiContext,apiFailure } from '@/lib/api';
import { safeLink } from '@/lib/validation';
import type { Attachment,Snapshot } from '@/types';
export const runtime='nodejs';
const bucket='kambambam-anexos';
export async function POST(request:NextRequest){
 try{
  if(Number(request.headers.get('content-length') ?? 0)>32_000) throw new Error('Requisição muito grande.');
  const raw=await request.text();if(raw.length>32_000)throw new Error('Requisição muito grande.');
  const body=JSON.parse(raw) as Record<string,unknown>;
  const {operate,client,actor}=await apiContext(request);
  const allowed=['list','create_board','snapshot','invite','accept','remove_member','add_card','edit_card','delete_card','add_link','delete_attachment','download'];
  const action=String(body.action ?? ''); if(!allowed.includes(action)) throw new Error('Operação inválida.');
  delete body.action;
  async function remove(a:Attachment){
   // Autorizar ANTES de tocar no Storage: RPC só depois seria tarde demais.
   const state=await operate<Snapshot>('snapshot',{board:a.board_id});
   if(state.board.kind!=='public' && a.owner_id!==actor && state.board.owner_id!==actor)throw new Error('Você não pode remover este anexo.');
   if(a.path){const {error}=await client.storage.from(bucket).remove([a.path]);if(error) throw new Error(error.message);}
   await operate('delete_attachment',{board:a.board_id,id:a.id});
  }
  if(action==='delete_card'){
   const state=await operate<Snapshot>('snapshot',{board:body.board});
   const attachment=state.attachments.find(a=>a.card_id===body.card);
   if(attachment) await remove(attachment);
  }
  if(action==='delete_attachment'){
   // A consulta verifica acesso e remove() verifica autoria antes do Storage.
   const state=await operate<Snapshot>('snapshot',{board:body.board});
   const attachment=state.attachments.find(a=>a.id===body.id);
   if(!attachment)throw new Error('Anexo não encontrado.');
   await remove(attachment);return Response.json({});
  }
  if(action==='download'){
   const a=await operate<Attachment>('attachment',body);
   if(a.status!=='ready')throw new Error('Envio ainda não concluído.');
   if(a.kind==='link')return Response.json({url:safeLink(a.url ?? '')});
   if(!a.path)throw new Error('Arquivo sem caminho.');
   const {data,error}=await client.storage.from(bucket).createSignedUrl(a.path,60,{download:a.name});
   if(error)throw new Error(error.message);return Response.json({url:data.signedUrl});
  }
  if(action==='add_link')body.url=safeLink(String(body.url));
  return Response.json(await operate(action,body));
 }catch(error){return apiFailure(error);}
}
