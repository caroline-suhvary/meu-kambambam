import { browserClient } from '@/lib/browser';
import { request } from '@/features/boards';
import { safeLink,validateFile } from '@/lib/validation';
export async function uploadAttachment(board:string,card:string,file:File,isPublic:boolean) {
 validateFile(file.name,file.size,isPublic);
 const {data}=await browserClient().auth.getSession();
 const form=new FormData(); form.set('board',board);form.set('card',card);form.set('file',file);
 const response=await fetch('/api/kambambam/upload',{method:'POST',headers:data.session?{Authorization:`Bearer ${data.session.access_token}`}:{},body:form});
 const result=await response.json(); if(!response.ok) throw new Error(result.error ?? 'Falha no envio.');
}
export const addLink=(board:string,card:string,name:string,url:string)=>request('add_link',{board,card,name,url:safeLink(url)});
export const removeAttachment=(board:string,id:string)=>request('delete_attachment',{board,id});
export async function openAttachment(board:string,id:string) {
 // Link é aberto pelo componente; arquivos recebem URL temporária assinada.
 return request<{url:string}>('download',{board,id});
}
