import type { NextRequest } from 'next/server';
import { apiContext,apiFailure } from '@/lib/api';
import { MAX_BYTES,validateFile } from '@/lib/validation';
import type { Attachment,Snapshot } from '@/types';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{
  const {client,operate}=await apiContext(request);
  if(Number(request.headers.get('content-length') ?? 0)>MAX_BYTES+32_768)throw new Error('Arquivo acima de 1 MB.');
  const form=await request.formData();
  const file=form.get('file');if(!(file instanceof File))throw new Error('Escolha um arquivo.');
  const board=String(form.get('board'));const card=String(form.get('card'));
  const state=await operate<Snapshot>('snapshot',{board});
  const extension=validateFile(file.name,file.size,state.board.kind==='public');
  const bytes=new Uint8Array(await file.arrayBuffer());
  // Para a demo pública, verificamos também a assinatura do formato.
  if(extension==='png' && ![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))throw new Error('Conteúdo não é PNG.');
  if(extension==='pdf' && new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('Conteúdo não é PDF.');
  const reservation=await operate<Attachment>('reserve_file',{board,card,name:file.name,size:file.size,extension});
  if(!reservation.path)throw new Error('Reserva sem caminho.');
  try{
   const {error}=await client.storage.from('kambambam-anexos').upload(reservation.path,bytes,{contentType:'application/octet-stream',upsert:false});
   if(error)throw new Error(error.message);
   await operate('commit_file',{board,id:reservation.id});
  }catch(error){
   // Compensação: evita manter espaço/cota ocupados após falha normal de envio.
   const removed=await client.storage.from('kambambam-anexos').remove([reservation.path]);
   if(!removed.error)await operate('delete_attachment',{board,id:reservation.id}).catch(()=>undefined);
   throw error;
  }
  return Response.json({ok:true});
 }catch(error){return apiFailure(error);}
}
