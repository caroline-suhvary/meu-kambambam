-- CONSULTAS MANUAIS para a proprietária, no SQL Editor. Não executar tudo
-- indiscriminadamente. Cada bloco é independente.
-- Contas registradas (e-mails só para a administradora do projeto):
select id,email,created_at from auth.users order by created_at;
-- Uso lógico dos anexos; não inclui objetos órfãos/eventual egress:
select count(*) as anexos,coalesce(sum(size),0) as bytes_reservados from public.anexos;
-- Reservas incompletas; remova pela interface (botão lixeira do anexo) ou
-- primeiro pelo Storage e depois DELETE da linha identificada, caso necessário:
select * from public.anexos where status='pending' and created_at < now()-interval '1 hour';
-- Antes de ativar o hook, contabilize contas existentes:
insert into public.cadastro_vagas(user_id) select id from auth.users on conflict do nothing;
-- Limpeza conservadora de vagas de cadastro que não resultaram em conta.
-- Não execute durante cadastros em andamento. Aguarde no mínimo uma hora.
delete from public.cadastro_vagas v where criado_em<now()-interval '1 hour'
 and not exists(select 1 from auth.users u where u.id=v.user_id);
