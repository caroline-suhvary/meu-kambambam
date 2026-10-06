import { request } from '@/features/boards';
// E-mails só são usados no convite; participantes não recebem uma lista de perfis.
export const inviteMember=(board:string,email:string)=>request('invite',{board,email});
export const acceptInvite=(board:string)=>request('accept',{board});
export const removeMember=(board:string,user:string)=>request('remove_member',{board,user});
