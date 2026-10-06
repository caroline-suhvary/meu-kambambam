"use client";
import {useState} from 'react';import {Download,Trash2,Paperclip,Link as LinkIcon} from 'lucide-react';
import type {Attachment as AttachmentType} from '@/types';
import {uploadAttachment,addLink,removeAttachment,openAttachment} from '@/features/attachments';
import './styles.css';
export default function Attachment({attachment,board,card,isPublic,canRemove,onChanged,onError}:{attachment?:AttachmentType;board:string;card:string;isPublic:boolean;canRemove:boolean;onChanged:()=>void;onError:(s:string)=>void}){
 const [busy,setBusy]=useState(false);const [linkMode,setLinkMode]=useState(false);const [url,setUrl]=useState('');const [name,setName]=useState('');
 async function run(fn:()=>Promise<unknown>){setBusy(true);try{await fn();onChanged();}catch(e){onError(e instanceof Error?e.message:'Falha no anexo.');}finally{setBusy(false);}}
 if(attachment)return <div className="attachment row"><Paperclip size={15}/><span>{attachment.name}{attachment.status==='pending'?' (envio incompleto)':''}</span>
 {attachment.status==='ready'&&<button className="icon-button" title="Abrir ou baixar anexo" aria-label="Abrir ou baixar anexo" disabled={busy} onClick={()=>{const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;void openAttachment(board,attachment.id).then(({url})=>{if(popup)popup.location.href=url;else onError('Permita abrir uma nova aba para baixar.');}).catch(e=>{popup?.close();onError(String(e.message));});}}><Download/></button>}
 {canRemove&&<button className="icon-button danger" title="Excluir anexo" aria-label="Excluir anexo" disabled={busy} onClick={()=>{if(confirm('Excluir este anexo?'))void run(()=>removeAttachment(board,attachment.id));}}><Trash2/></button>}</div>;
 return <div className="attachment stack"><div className="row"><label className="upload-label"><Paperclip size={15}/>Arquivo<input aria-label="Enviar arquivo" type="file" disabled={busy} accept={isPublic?'.pdf,.png':'.pdf,.png,.jpg,.jpeg,.docx,.xlsx,.xls,.zip,.txt'} onChange={e=>{const file=e.target.files?.[0];if(file)void run(()=>uploadAttachment(board,card,file,isPublic));e.target.value='';}}/></label><button title="Anexar link" aria-label="Anexar link" disabled={busy} onClick={()=>setLinkMode(!linkMode)}><LinkIcon size={15}/></button></div>
 {linkMode&&<form className="stack" onSubmit={e=>{e.preventDefault();void run(()=>addLink(board,card,name,url));}}><input placeholder="Nome do link" required maxLength={255} value={name} onChange={e=>setName(e.target.value)}/><input aria-label="Endereço do link" type="url" placeholder="https://" required maxLength={2048} value={url} onChange={e=>setUrl(e.target.value)}/><button disabled={busy}>Salvar link</button></form>}{busy&&<small>Enviando…</small>}</div>;
}
