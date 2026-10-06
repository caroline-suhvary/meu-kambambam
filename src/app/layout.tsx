import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'MEU KAMBAMBAM — tarefas e arquivos',description:'Kanban de portfólio com quadros individuais, grupos e anexos.',openGraph:{title:'MEU KAMBAMBAM',description:'Organize suas tarefas em quadros.',type:'website'},twitter:{card:'summary'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>;}
