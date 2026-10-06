import type {ReactNode} from 'react';import './styles.css';
export default function KanbanColumn({label,count,children}:{label:string;count:number;children:ReactNode}){return <section className="kanban-column"><header><h2>{label}</h2><span>{count}</span></header><div className="stack">{children}</div></section>;}
