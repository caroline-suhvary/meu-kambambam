// Tipos descrevem o formato dos dados; não fazem consultas nem guardam estado.
export type Column = 'a_fazer' | 'em_andamento' | 'revisao' | 'concluido';
export type Board = { id: string; title: string; kind: 'public' | 'individual' | 'group'; owner_id: string | null };
export type Attachment = { id: string; card_id: string; board_id: string; owner_id: string | null; kind: 'file' | 'link'; name: string; url: string | null; path: string | null; status: 'pending' | 'ready'; size: number };
export type Card = { id: string; board_id: string; title: string; description: string; column_key: Column; created_at: string };
export type Member = { user_id: string; name: string; status: 'active' | 'invited' };
export type Snapshot = { board: Board; cards: Card[]; attachments: Attachment[]; members: Member[] };
export const COLUMNS: { key: Column; label: string }[] = [{key:'a_fazer',label:'A fazer'},{key:'em_andamento',label:'Em andamento'},{key:'revisao',label:'Revisão'},{key:'concluido',label:'Concluído'}];
