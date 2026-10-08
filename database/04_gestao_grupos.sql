-- ATUALIZAÇÃO: executar UMA VEZ na conta que já atende o KAMBAMBAM.
-- Não execute novamente 01_schema.sql. Nenhum grupo existente é apagado aqui.
begin;
-- A fila permite repetir uma limpeza de Storage que falhou por problema de rede.
-- Nunca apagamos linhas de storage.objects diretamente.
create table if not exists public.kambambam_limpeza_arquivos (
 path text primary key,
 owner_id uuid not null,
 created_at timestamptz not null default now()
);
grant all on public.kambambam_limpeza_arquivos to service_role;
revoke all on public.kambambam_limpeza_arquivos from anon, authenticated;
alter table public.kambambam_limpeza_arquivos enable row level security;

-- Função separada: preserva kambambam_operar e as correções feitas anteriormente.
-- Só a API pode executar. actor vem de getUser(), nunca do formulário.
create or replace function public.kambambam_gerenciar_grupo(actor uuid, action text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_board public.quadros;
 v_id uuid;
 v_target uuid;
 v_title text;
begin
 -- Mesmo lock da função original: mantém cotas e exclusões serializadas.
 perform pg_advisory_xact_lock(81475002);
 if actor is null then raise exception 'Entre para gerenciar um grupo.'; end if;
 if action='cleanup_list' then
  return coalesce((select jsonb_agg(q.path) from public.kambambam_limpeza_arquivos q where q.owner_id=actor),'[]'::jsonb);
 end if;
 if action='cleanup_done' then
  delete from public.kambambam_limpeza_arquivos q
   where q.owner_id=actor and q.path in (select jsonb_array_elements_text(payload->'paths'));
  return '{}'::jsonb;
 end if;
 v_id := (payload->>'board')::uuid;
 select q.* into v_board from public.quadros q where q.id=v_id;
 if v_board.id is null or v_board.kind<>'group' then raise exception 'Grupo não encontrado.'; end if;
 if not exists(select 1 from public.membros m where m.board_id=v_id and m.user_id=actor and m.status='active') then
  raise exception 'Você não participa deste grupo.';
 end if;
 if action='leave_group' then
  if actor=v_board.owner_id then raise exception 'A pessoa criadora não pode sair. Exclua o grupo se quiser encerrá-lo.'; end if;
  v_target:=actor;
 elsif action in ('rename_group','delete_group','remove_member') then
  if actor is distinct from v_board.owner_id then raise exception 'Somente a pessoa criadora pode fazer esta alteração.'; end if;
 else
  raise exception 'Operação desconhecida.';
 end if;
 if action='rename_group' then
  v_title:=trim(payload->>'title');
  if v_title is null or length(v_title) not between 1 and 100 then raise exception 'O nome precisa ter entre 1 e 100 caracteres.'; end if;
  update public.quadros q set title=v_title where q.id=v_id;
  return '{}'::jsonb;
 end if;
 if action='delete_group' then
  -- Primeiro a transação guarda caminhos para limpeza e remove só este grupo.
  insert into public.kambambam_limpeza_arquivos(path,owner_id)
   select a.path,actor from public.anexos a where a.board_id=v_id and a.kind='file' and a.path is not null
   on conflict(path) do nothing;
  delete from public.anexos a where a.board_id=v_id;
  delete from public.cards c where c.board_id=v_id;
  delete from public.membros m where m.board_id=v_id;
  delete from public.quadros q where q.id=v_id;
  return '{}'::jsonb;
 end if;
 if action='remove_member' then v_target:=(payload->>'user')::uuid; end if;
 if v_target is null or v_target=v_board.owner_id then raise exception 'Não é possível remover a pessoa criadora.'; end if;
 if not exists(select 1 from public.membros m where m.board_id=v_id and m.user_id=v_target) then raise exception 'Participante não encontrado.'; end if;
 -- Preserva o mínimo de duas vagas da versão original. Convites reservam vagas.
 if (select count(*) from public.membros m where m.board_id=v_id)<=2 then
  raise exception 'O grupo precisa manter pelo menos duas vagas. A pessoa criadora deve convidar outra pessoa antes, ou excluir o grupo.';
 end if;
 -- Não retém documentos de uma pessoa que perdeu o acesso. Ela ou a criadora
 -- deve removê-los primeiro pela interface. As tarefas permanecem no quadro.
 if exists(select 1 from public.anexos a where a.board_id=v_id and a.owner_id=v_target) then
  raise exception 'Remova os anexos e links desta pessoa antes de sair ou removê-la do grupo.';
 end if;
 delete from public.membros m where m.board_id=v_id and m.user_id=v_target;
 return '{}'::jsonb;
end $$;
revoke all on function public.kambambam_gerenciar_grupo(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.kambambam_gerenciar_grupo(uuid,text,jsonb) to service_role;
commit;
