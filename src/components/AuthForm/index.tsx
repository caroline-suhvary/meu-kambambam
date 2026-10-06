"use client";
import {useState} from 'react';
import {signIn,signUp,requestRecovery} from '@/features/auth';
import './styles.css';
// O formulário tem estado local; ele não é responsável por carregar os cards.
export default function AuthForm({onClose}:{onClose:()=>void}){
 const [mode,setMode]=useState<'login'|'signup'|'forgot'>('login');
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setMessage('');try{
  if(mode==='forgot'){await requestRecovery(email);setMessage('Confira seu e-mail para redefinir a senha.');}
  else if(mode==='signup'){const session=await signUp(name,email,password);if(session)onClose();else setMessage('Confira seu e-mail e confirme o cadastro antes de entrar.');}
  else{await signIn(email,password);onClose();}
 }catch(error){setMessage(error instanceof Error?error.message:'Falha no acesso.');}finally{setBusy(false);}}
 return <section className="auth-panel"><div className="row"><h2>{mode==='signup'?'Criar conta':mode==='forgot'?'Recuperar senha':'Entrar'}</h2><button onClick={onClose}>Fechar</button></div><form onSubmit={submit} className="stack">
 {mode==='signup'&&<><label>Nome<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label><small>Seu nome e e-mail ficam acessíveis à proprietária do projeto. Sua senha não é visível para ela.</small></>}
 <label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
 {mode!=='forgot'&&<label>Senha<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='signup'?'new-password':'current-password'}/></label>}
 <button className="primary" disabled={busy}>{busy?'Aguarde…':mode==='signup'?'Cadastrar':mode==='forgot'?'Enviar e-mail':'Entrar'}</button><p role="status">{message}</p>
 </form><div className="row"><button disabled={busy} onClick={()=>setMode(mode==='signup'?'login':'signup')}>{mode==='signup'?'Já tenho conta':'Criar conta'}</button><button disabled={busy} onClick={()=>setMode('forgot')}>Esqueci minha senha</button></div></section>;
}
