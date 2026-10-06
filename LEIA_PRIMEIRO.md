# MEU KAMBAMBAM — código para o seu computador

Este pacote é um projeto **Next.js + React + TypeScript + Tailwind CSS** separado
do Kanban anterior. Contém arquivos de código de verdade, não apenas uma lista
de pastas. Não foi publicado, executado nem conectado a nenhuma conta sua.

## 1. Abrir e instalar

1. Extraia o ZIP. Abra no VS Code a pasta `meu-kambambam` que contém package.json.
2. Use Node.js LTS atual (mínimo 20.9; preferível 22 ou 24).
3. No terminal Git Bash, execute:

```bash
npm install
cp .env.example .env.local
```

Não copie node_modules de outro projeto. npm install cria package-lock.json;
versione esse arquivo para manter as versões instaladas. As faixas de versões
no package.json buscam correções atuais; execute npm audit e leia avisos antes
de divulgar. Não use npm audit fix --force automaticamente.

## 2. Preencher .env.local — todas as quatro variáveis

Use exclusivamente o **seu projeto** criado para MEU KAMBAMBAM.

- NEXT_PUBLIC_SUPABASE_URL: Project URL.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: chave pública/publishable.
- SUPABASE_SECRET_KEY: chave secreta de servidor (sb_secret_...) ou service_role
  legada, disponível na SUA conta externa. Nunca a chave pública neste campo.
- APP_ORIGIN: http://localhost:3000 para começar, sem caminho no final.

Se seu dev usar outra porta, ajuste APP_ORIGIN. Reinicie npm run dev depois
que alterar variáveis. Não envie chaves no chat, prints nem GitHub.

Os campos NEXT_PUBLIC chegam ao navegador. SUPABASE_SECRET_KEY NÃO pode receber
esse prefixo. Ela é usada apenas pelos arquivos de servidor da API.

## 3. Preparar tabelas

1. Abra o SQL Editor no painel do seu projeto.
2. Cole **database/01_schema.sql inteiro** e execute uma vez.
3. O arquivo cria perfis, quadros, membros, cards, anexos e funções. Se existir a
   tabela perfis criada na etapa inicial, ela será reutilizada. Se já executou
   esta migração completa, NÃO repita; nomes já existentes dão erro.
4. Não execute esse SQL na conta/banco do Kanban antigo.
5. Abra Table Editor. Haverá um quadro público e três tarefas iniciais.
6. Para contas antigas, execute APENAS o bloco indicado de contabilização em
   database/03_manutencao.sql antes de ativar o limite de cadastro.

GRANT dá acesso à operação; RLS limita quais linhas a pessoa pode ler. Cada
pessoa só consulta seu perfil. Participantes de grupo recebem nomes dos membros,
não e-mails, senhas ou uma lista de todas as contas.

## 4. Ativar cadastro e o limite de 50 contas — OBRIGATÓRIO

No painel da SUA conta:

1. Authentication → Sign In / Providers (ou Providers): habilite Email.
2. Mantenha confirmação de e-mail ligada. Cadastre senha com pelo menos 8 caracteres.
3. Authentication → URL Configuration: Site URL http://localhost:3000.
4. Redirect URLs: adicione http://localhost:3000 e
   http://localhost:3000/reset-password.
5. Authentication → Hooks: selecione **Before User Created** e escolha a função
   PostgreSQL **public.limitar_cadastro**. Salve/ative.
6. CONFIRME que o hook aparece ativo. Sem isso, o limite de 50 contas NÃO está
   aplicado ao Auth, mesmo com o SQL criado. A tela sozinha não impõe esse limite.
7. Se essa opção não estiver disponível na sua conta, pare antes de abrir cadastros
   públicos: essa parte precisa de uma alternativa de controle de admissão.

Hooks têm limite de tempo. O protótipo usa lock curto para impedir dois cadastros
simultâneos de ultrapassarem a cota. Cadastros interrompidos podem reservar uma
vaga; a manutenção conservadora está documentada em 03_manutencao.sql.

O envio padrão de e-mails do serviço de autenticação tem limites e restrições,
e pode não enviar para qualquer amigo sem configurar SMTP próprio. Antes de
convidar amigos, confira os limites atuais e, se necessário, configure seu
provedor SMTP no painel Auth. Não desative confirmação silenciosamente para
contornar isso. Nenhum provedor de e-mail externo foi contratado neste pacote.

## 5. Criar o bucket

Siga database/02_storage.md. Nome exato: **kambambam-anexos**.
Privado, máximo **1 MB**; nenhuma política permissiva para upload direto.
Não confunda os registros de anexos (banco) com os arquivos (Storage).

## 6. Rodar e testar no seu computador

```bash
npm run dev
```

Abra http://localhost:3000. Se algo falhar, a tela mostra uma mensagem e botão
Tentar novamente. Veja também o terminal para erros de configuração.

**Teste antes de divulgar** (o pacote não foi testado contra sua conta):

- Sem login: criar/editar/mover/excluir tarefa pública.
- Anexar PDF/PNG de até 1 MB e adicionar um link; cada card só aceita um anexo.
- Ao chegar a cinco anexos públicos, o sexto deve falhar, inclusive links.
- Excluir tarefa com anexo deve remover o arquivo e liberar a vaga.
- Criar conta com nome, e-mail e senha; confirmar e-mail; entrar e sair.
- Usar Esqueci minha senha e testar a página de redefinição pelo link de e-mail.
- Criar um individual; tentativa de segundo deve falhar.
- Criar segunda conta e entrar nela ao menos uma vez (isso cria seu perfil).
- Na primeira conta, criar grupo informando o e-mail da segunda; ela aceita convite.
- Convite pendente reserva vaga, mas não dá leitura do quadro nem cota de anexos.
- Convidar terceiro/quarto; quinto deve falhar, incluindo convites pendentes.
- Cada membro ativo: até cinco anexos POR QUADRO. Duas pessoas ativas têm até dez,
  três até quinze, quatro até vinte. Conta convidada não usa cota até aceitar.
- Não é possível criar segundo grupo próprio; é possível entrar em outros.
- Participante não pode abrir quadro privado alheio nem remover anexo alheio.
- Criador pode remover anexos do seu grupo. Antes de remover membro, precisa
  remover anexos dele. Grupo conserva pelo menos duas vagas ativas/pendentes.
- Abrir duas abas e tentar enviar o último anexo ao mesmo tempo; cota deve permanecer.

## 7. Publicar na Vercel, SOMENTE depois dos testes

```bash
npm run typecheck
npm run build
npm audit
```

1. Confira que .env.local está ignorado; nunca use git add -f nele.
2. Crie um repositório SEU no GitHub; copie a URL HTTPS que ELE mostrar.
3. Terminal Git Bash (se ainda não há Git nesta pasta):

```bash
git init
git add .
git commit -m "MEU KAMBAMBAM inicial"
git branch -M main
# Troque o texto abaixo pela URL real do repositório que você criou:
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

4. Na Vercel importe esse repositório. Framework: Next.js, diretório desta pasta;
   deixe saída automática. Não configure dist, não copie configurações do Vite.
5. Cadastre as quatro variáveis de .env.local como Environment Variables.
6. APP_ORIGIN será https://SEU-DOMINIO.vercel.app (sem barra/caminho). Use o domínio
   estável de produção, não um endereço provisório diferente a cada deploy.
7. Configure esse domínio também como Site URL e Redirect URL no Auth, e inclua
   https://SEU-DOMINIO.vercel.app/reset-password nos redirecionamentos permitidos.
8. Deploy. Teste cadastro, login, quadro privado e download no domínio publicado.
9. Preview deployments precisam de APP_ORIGIN correspondente ao seu domínio e
   URLs de Auth autorizadas. Não configure origem '*' para "resolver" erros.

## Limitações importantes, sem promessas de custo zero ilimitado

- É protótipo educativo. Cotas de anexos NÃO limitam downloads, requisições,
  número de cards, tráfego, tentativas abusivas nem armazenamento órfão.
- O quadro público permite modificação/exclusão anônima por requisito seu.
  Isso não é seguro para documentos importantes; visitantes podem apagar tudo.
- Arquivos são baixados, não editados internamente; links abrem o serviço externo.
  Não há antivírus. Mesmo PDF pode conter conteúdo perigoso; só abra fontes confiáveis.
- Na demo, checamos extensão e assinatura PNG/PDF; isso NÃO equivale a antivírus.
- Nome/e-mail são visíveis à dona via painel; senha nunca é armazenada pela aplicação.
- SMTP, abuso anônimo, recuperação de arquivos órfãos, backups e limites do plano
  precisam ser monitorados pela proprietária. O aplicativo não garante que a
  plataforma enviará aviso de limite nem que todo consumo será gratuito.
- A interface atualiza a cada 30 segundos ou pelo botão atualizar, não usa presença
  colaborativa instantânea. Seletores movem tarefas; drag-and-drop não foi incluído.
- Grupos começam com criador + segunda vaga convidada; só duas pessoas ativas
  caracterizam colaboração efetiva. Membros precisam já ter conta e perfil.
- Exclusão da conta/grupo completo, painel administrativo e login Google não fazem
  parte desta entrega. Autenticação aqui é nome/e-mail/senha conforme sua última escolha.
- URLs de download duram 60 segundos. Quem receber uma URL válida pode usá-la
  até expirar, mesmo fora do aplicativo. Não há credenciais reais neste pacote.

## Onde estudar

Abra MAPA_DO_FLUXO.md. Comece por page.tsx → Kambambam → KanbanBoard → KanbanCard.
