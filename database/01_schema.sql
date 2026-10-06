-- MEU KAMBAMBAM: execute UMA VEZ no SQL Editor do SEU projeto novo.
-- Não executar este arquivo no banco do Kanban antigo. Não contém credenciais.
-- Se já criou public.perfis com a etapa anterior, ele será reutilizado.
begin;
create table if not exists public.perfis (id uuid primary key,nome text not null,criado_em timestamptz not null default now());
grant select, update on public.perfis to authenticated;
grant all on public.perfis to service_role;
alter table public.perfis enable row level security;
drop policy if exists "perfil_proprio_leitura" on public.perfis;
drop policy if exists "perfil_proprio_edicao" on public.perfis;
create policy "perfil_proprio_leitura" on public.perfis for select to authenticated using (auth.uid()=id);
create policy "perfil_proprio_edicao" on public.perfis for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);

-- Reserva de vagas de cadastro. Só o Auth Hook e o servidor têm acesso.
create table public.cadastro_vagas(user_id uuid primary key,criado_em timestamptz not null default now());
grant all on public.cadastro_vagas to service_role;
alter table public.cadastro_vagas enable row level security;

create table public.quadros(id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 100),kind text not null check(kind in ('public','individual','group')),owner_id uuid references public.perfis(id),created_at timestamptz not null default now(),check((kind='public')=(owner_id is null)));
grant select on public.quadros to anon,authenticated;
grant all on public.quadros to service_role;
alter table public.quadros enable row level security;
create unique index um_quadro_por_tipo_e_dono on public.quadros(owner_id,kind) where kind<>'public';
create unique index unica_demonstracao on public.quadros(kind) where kind='public';

create table public.membros(board_id uuid not null references public.quadros(id) on delete cascade,user_id uuid not null references public.perfis(id),status text not null check(status in ('active','invited')),primary key(board_id,user_id));
grant select on public.membros to authenticated;
grant all on public.membros to service_role;
alter table public.membros enable row level security;

create table public.cards(id uuid primary key default gen_random_uuid(),board_id uuid not null references public.quadros(id),title text not null check(length(title) between 1 and 200),description text not null default '' check(length(description)<=4000),column_key text not null default 'a_fazer' check(column_key in ('a_fazer','em_andamento','revisao','concluido')),created_at timestamptz not null default now());
grant select on public.cards to anon,authenticated;
grant all on public.cards to service_role;
alter table public.cards enable row level security;
create index cards_quadro on public.cards(board_id);

-- Há no máximo UMA linha de anexo por card. Links e arquivos têm o mesmo custo de cota.
create table public.anexos(id uuid primary key default gen_random_uuid(),card_id uuid not null unique references public.cards(id),board_id uuid not null references public.quadros(id),owner_id uuid references public.perfis(id),kind text not null check(kind in ('file','link')),name text not null check(length(name) between 1 and 255),url text,path text,size integer not null default 0 check(size between 0 and 1048576),status text not null default 'pending' check(status in ('pending','ready')),created_at timestamptz not null default now(),check((kind='link' and url is not null and path is null and size=0) or (kind='file' and path is not null and url is null and size>0)));
grant select on public.anexos to anon,authenticated;
grant all on public.anexos to service_role;
alter table public.anexos enable row level security;
create index anexos_quadro on public.anexos(board_id);

-- SECURITY DEFINER aqui evita recursão ao consultar a própria tabela de membros.
create function public.pode_ler_quadro(b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.quadros q where q.id=b and (q.kind='public' or q.owner_id=auth.uid() or exists(select 1 from public.membros m where m.board_id=b and m.user_id=auth.uid() and m.status='active')))
$$;
revoke all on function public.pode_ler_quadro(uuid) from public;
grant execute on function public.pode_ler_quadro(uuid) to anon,authenticated,service_role;
create policy quadros_leitura on public.quadros for select to anon,authenticated using(public.pode_ler_quadro(id));
create policy membros_leitura on public.membros for select to authenticated using(public.pode_ler_quadro(board_id) or user_id=auth.uid());
create policy cards_leitura on public.cards for select to anon,authenticated using(public.pode_ler_quadro(board_id));
create policy anexos_leitura on public.anexos for select to anon,authenticated using(status='ready' and public.pode_ler_quadro(board_id));

insert into public.quadros(id,title,kind) values('00000000-0000-4000-8000-000000000001','Demonstração pública','public');
insert into public.cards(board_id,title,description,column_key) values
 ('00000000-0000-4000-8000-000000000001','Bem-vinda ao MEU KAMBAMBAM','Este quadro é público e pode ser alterado por qualquer visitante.','a_fazer'),
 ('00000000-0000-4000-8000-000000000001','Revisar planilha de gastos','Experimente anexar um link de planilha.','em_andamento'),
 ('00000000-0000-4000-8000-000000000001','Separar documentos','Na demonstração, arquivos PDF e PNG de até 1 MB.','revisao');

-- LIMITE DE 50: configurar esta função como Before User Created Hook no painel Auth.
-- A tabela registra a reserva antes de o serviço criar a conta. Falha de cadastro
-- pode deixar uma reserva; veja limpeza manual em 03_manutencao.sql.
create function public.limitar_cadastro(event jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
 declare uid uuid := (event->'user'->>'id')::uuid;
 begin
  perform pg_advisory_xact_lock(81475001);
  if uid is null then return jsonb_build_object('error',jsonb_build_object('http_code',400,'message','Cadastro sem identificador.')); end if;
  if not exists(select 1 from public.cadastro_vagas where user_id=uid) then
   if (select count(*) from public.cadastro_vagas)>=50 then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Este protótipo atingiu o limite de 50 contas.'));
   end if;
   insert into public.cadastro_vagas(user_id) values(uid);
  end if;
  return '{}'::jsonb;
 end $$;
revoke all on function public.limitar_cadastro(jsonb) from public,anon,authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.limitar_cadastro(jsonb) to supabase_auth_admin;

-- RPC central. Nenhum visitante pode chamar diretamente com um UUID falso:
-- EXECUTE é exclusivo de service_role; a API valida o token com getUser().
create function public.kambambam_operar(actor uuid,action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
 declare b public.quadros; c public.cards; a public.anexos; bid uuid; cid uuid; aid uuid;
 target uuid; result jsonb; title text; email_value text; extension text; member_count integer;
 begin
  -- Um lock global é simples e adequado ao protótipo pequeno. Todas as cotas
  -- e alterações abaixo são atômicas: duas abas não passam do limite juntas.
  perform pg_advisory_xact_lock(81475002);
  if actor is not null and not exists(select 1 from public.perfis where id=actor) then
   raise exception 'Perfil ainda não preparado. Entre novamente.';
  end if;
  if action='list' then
   return jsonb_build_object('boards',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at) from public.quadros q where q.kind='public' or q.owner_id=actor or exists(select 1 from public.membros m where m.board_id=q.id and m.user_id=actor and m.status='active')),'[]'::jsonb),'invites',coalesce((select jsonb_agg(to_jsonb(q)) from public.quadros q join public.membros m on m.board_id=q.id where m.user_id=actor and m.status='invited'),'[]'::jsonb));
  end if;
  if action='create_board' then
   if actor is null then raise exception 'Entre para criar um quadro.'; end if;
   title:=trim(payload->>'title');
   if payload->>'kind' not in ('individual','group') then raise exception 'Tipo de quadro inválido.';end if;
   if payload->>'kind'='group' then
    if (select count(*) from public.quadros where kind='group')>=25 then raise exception 'Limite de 25 grupos atingido.';end if;
    -- Uma segunda conta é obrigatória. Convite pendente já reserva a segunda vaga.
    select p.id into target from public.perfis p join auth.users u on u.id=p.id where lower(u.email)=lower(trim(payload->>'email'));
    if target is null or target=actor then raise exception 'Informe o e-mail de outra pessoa que já tenha entrado no aplicativo.';end if;
   end if;
   insert into public.quadros(title,kind,owner_id) values(title,payload->>'kind',actor) returning * into b;
   insert into public.membros values(b.id,actor,'active');
   if b.kind='group' then insert into public.membros values(b.id,target,'invited');end if;
   return to_jsonb(b);
  end if;
  bid:=(payload->>'board')::uuid;
  select * into b from public.quadros where id=bid;
  if b.id is null then raise exception 'Quadro não encontrado.';end if;
  if action='accept' then
   if actor is null then raise exception 'Entre para aceitar.';end if;
   update public.membros set status='active' where board_id=bid and user_id=actor and status='invited';
   if not found then raise exception 'Convite não encontrado.';end if;
   return '{}'::jsonb;
  end if;
  if b.kind<>'public' and (actor is null or not exists(select 1 from public.membros where board_id=bid and user_id=actor and status='active')) then raise exception 'Sem acesso a este quadro.';end if;
  if action='snapshot' then
   return jsonb_build_object('board',to_jsonb(b),'cards',coalesce((select jsonb_agg(to_jsonb(x) order by created_at) from public.cards x where board_id=bid),'[]'::jsonb),'attachments',coalesce((select jsonb_agg(to_jsonb(x)) from public.anexos x where board_id=bid),'[]'::jsonb),'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',p.nome,'status',m.status)) from public.membros m join public.perfis p on p.id=m.user_id where m.board_id=bid),'[]'::jsonb));
  end if;
  if action='invite' then
   if b.kind<>'group' or actor<>b.owner_id then raise exception 'Somente a pessoa criadora pode convidar.';end if;
   if (select count(*) from public.membros where board_id=bid)>=4 then raise exception 'O grupo já tem quatro vagas ocupadas ou reservadas.';end if;
   select p.id into target from public.perfis p join auth.users u on p.id=u.id where lower(u.email)=lower(trim(payload->>'email'));
   if target is null then raise exception 'A pessoa precisa cadastrar-se e entrar no aplicativo primeiro.';end if;
   insert into public.membros values(bid,target,'invited'); return '{}'::jsonb;
  end if;
  if action='remove_member' then
   target:=(payload->>'user')::uuid;
   if b.kind<>'group' or actor<>b.owner_id or target=b.owner_id then raise exception 'Remoção não permitida.';end if;
   if (select count(*) from public.membros where board_id=bid)<=2 then raise exception 'O grupo precisa manter pelo menos duas vagas. Convide outra pessoa antes.';end if;
   if exists(select 1 from public.anexos where board_id=bid and owner_id=target) then raise exception 'Remova os anexos desta pessoa antes de removê-la.';end if;
   delete from public.membros where board_id=bid and user_id=target; return '{}'::jsonb;
  end if;
  if action='add_card' then
   insert into public.cards(board_id,title,description) values(bid,trim(payload->>'title'),coalesce(payload->>'description','')) returning * into c; return to_jsonb(c);
  end if;
  if action in ('edit_card','delete_card','reserve_file','add_link') then
   cid:=(payload->>'card')::uuid;
   select * into c from public.cards where id=cid and board_id=bid;
   if c.id is null then raise exception 'Card não encontrado.';end if;
  end if;
  if action='edit_card' then
   update public.cards set title=coalesce(payload->>'title',title),description=coalesce(payload->>'description',description),column_key=coalesce(payload->>'column',column_key) where id=cid;return '{}'::jsonb;
  end if;
  if action='delete_card' then
   -- O servidor precisa apagar primeiro o arquivo via Storage API.
   if exists(select 1 from public.anexos where card_id=cid) then raise exception 'Remova o anexo antes de excluir o card.';end if;
   delete from public.cards where id=cid;return '{}'::jsonb;
  end if;
  if action in ('reserve_file','add_link') then
   if exists(select 1 from public.anexos where card_id=cid) then raise exception 'Cada card aceita somente um anexo.';end if;
   if b.kind='public' then
    if (select count(*) from public.anexos where board_id=bid)>=5 then raise exception 'A demonstração já tem cinco anexos.';end if;
   else
    if (select count(*) from public.anexos where board_id=bid and owner_id=actor)>=5 then raise exception 'Você já tem cinco anexos neste quadro.';end if;
    select count(*) into member_count from public.membros where board_id=bid and status='active';
    if (select count(*) from public.anexos where board_id=bid)>=least(20,member_count*5) then raise exception 'A cota dos participantes ativos foi atingida.';end if;
   end if;
   aid:=gen_random_uuid();
   if action='add_link' then
    if length(payload->>'url')>2048 or payload->>'url' !~ '^https?://' then raise exception 'Link inválido.';end if;
    insert into public.anexos(id,card_id,board_id,owner_id,kind,name,url,status) values(aid,cid,bid,case when b.kind='public' then null else actor end,'link',trim(payload->>'name'),payload->>'url','ready') returning * into a;
   else
    extension:=lower(payload->>'extension');
    if (b.kind='public' and extension not in ('pdf','png')) or extension not in ('pdf','png','jpg','jpeg','docx','xlsx','xls','zip','txt') then raise exception 'Formato não permitido.';end if;
    insert into public.anexos(id,card_id,board_id,owner_id,kind,name,path,size) values(aid,cid,bid,case when b.kind='public' then null else actor end,'file',payload->>'name',bid::text||'/'||aid::text||'.'||extension,(payload->>'size')::integer) returning * into a;
   end if;
   return to_jsonb(a);
  end if;
  if action in ('attachment','commit_file','delete_attachment') then
   aid:=(payload->>'id')::uuid;
   select * into a from public.anexos where id=aid and board_id=bid;
   if a.id is null then raise exception 'Anexo não encontrado.';end if;
   if action='attachment' then return to_jsonb(a);end if;
   if b.kind<>'public' and a.owner_id<>actor and b.owner_id<>actor then raise exception 'Somente quem enviou ou criou o quadro pode remover o anexo.';end if;
   if action='commit_file' then update public.anexos set status='ready' where id=aid;
   else delete from public.anexos where id=aid;end if;
   return '{}'::jsonb;
  end if;
  raise exception 'Operação desconhecida.';
 end $$;
revoke all on function public.kambambam_operar(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.kambambam_operar(uuid,text,jsonb) to service_role;

-- Perfil criado após getUser(), sem trigger no schema auth. Nunca guardamos senha.
create function public.kambambam_preparar_perfil(uid uuid,nome text) returns void language plpgsql security definer set search_path=public as $$
 begin
  if not exists(select 1 from auth.users where id=uid) then raise exception 'Conta inexistente.';end if;
  if length(trim(nome))<1 or length(nome)>100 then raise exception 'Nome inválido.';end if;
  insert into public.perfis(id,nome) values(uid,trim(nome)) on conflict(id) do nothing;
 end $$;
revoke all on function public.kambambam_preparar_perfil(uuid,text) from public,anon,authenticated;
grant execute on function public.kambambam_preparar_perfil(uuid,text) to service_role;
commit;
