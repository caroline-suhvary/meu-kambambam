import { request } from "@/features/boards";
// E-mails só são usados no convite; participantes não recebem uma lista de perfis.
export const inviteMember = (board: string, email: string) =>
  request("invite", { board, email });
export const acceptInvite = (board: string) => request("accept", { board });
export const removeMember = (board: string, user: string) =>
  request("remove_member", { board, user });

// FILHO → serviço → API → função SQL: só após a confirmação o pai recarrega.
export const renameGroup = (board: string, title: string) =>
  request("rename_group", { board, title });
export const deleteGroup = (board: string) =>
  request<{ warning?: string }>("delete_group", { board });
export const leaveGroup = (board: string) => request("leave_group", { board });
export const retryGroupCleanup = () => request("retry_group_cleanup");
