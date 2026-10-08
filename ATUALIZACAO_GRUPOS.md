# Atualização — grupos do MEU KAMBAMBAM

O ZIP contém seu projeto atualizado, incluindo o título cursivo colorido.
Não altera o Kanban React/Vite, não troca seu banco e não muda configurações da Vercel.

## Aplicar sem perder suas configurações
1. Faça uma cópia da pasta que funciona atualmente.
2. Na sua conta do banco que atende o KAMBAMBAM, execute **somente** `database/04_gestao_grupos.sql` uma vez no editor SQL. Esse arquivo adiciona uma função e uma fila privada de limpeza; não exclui dados existentes. **Não reexecute 01_schema.sql.**
3. Na pasta atual do VS Code, substitua somente estes arquivos pelos do ZIP:
   - `src/lib/api.ts`
   - `src/app/api/kambambam/route.ts`
   - `src/features/groups/index.ts`
   - `src/components/Kambambam/index.tsx`
   - `src/components/Kambambam/styles.css`
   Acrescente `database/04_gestao_grupos.sql` e este guia. Os demais arquivos são uma cópia do que você enviou.
4. Preserve `.env.local`, `.git` e as credenciais locais. O ZIP não inclui esses arquivos nem suas dependências.
5. Reinicie `npm run dev` e teste. Antes de publicar, execute `npm run build`.
6. Envie as alterações ao mesmo GitHub. A Vercel conectada publica normalmente: sem trocar variáveis, domínio, Storage ou configurações de autenticação.

## O que aparece para cada pessoa
- Criadora: **Alterar nome**, **Excluir grupo**, **Convidar** e **Remover** ao lado dos outros participantes (inclusive convites pendentes).
- Participante: **Sair do grupo**. Não vê ações administrativas.
- Criadora não pode sair nem ser removida: pode encerrar o grupo. Transferência de propriedade não faz parte desta atualização.
- Excluir exige confirmação e apaga apenas aquele grupo, seus convites, tarefas e anexos. As contas e quadros individuais permanecem. Libera a vaga de grupo criado e a vaga no limite global.
- Remover/sair mantém as tarefas. Antes, remova os arquivos e links da pessoa; eles não são apagados silenciosamente.
- O mínimo existente de duas vagas é preservado: se há só duas, a criadora deve convidar outra pessoa antes da saída/remoção, ou excluir o grupo. Convites pendentes já reservam vaga, como na versão anterior.

## Limpeza de arquivos e falhas de rede
O banco registra os caminhos e exclui as linhas do grupo em uma transação; depois a API remove os arquivos pelo Storage. Se a limpeza falhar, aparece **Tentar limpar arquivos**. Essa fila é privada e só o servidor a acessa. Se recarregar e perder o aviso, use o ícone de lixeira na barra de seleção de quadros, com o nome **Limpar arquivos pendentes de grupos excluídos**. Ele só limpa arquivos já registrados para exclusão pela sua conta; não exclui grupos existentes.

Uma URL de download já emitida pode continuar válida por até 60 segundos, como antes. Não há transação única entre banco e Storage; arquivos pendentes continuam privados e ocupam espaço até a limpeza.

## Fluxo didático
Clique → componente Kambambam → serviço groups → request com sessão → API valida origem e token → função SQL verifica criadora/membro e aplica regra → resposta → pai recarrega a lista e o quadro.
Esconder botões não protege dados: a autorização é repetida na função SQL, cujo EXECUTE é restrito ao servidor.

## Checklist na sua conta
- Criadora renomeia e vê o nome novo após recarregar.
- Participante vê Sair, não renomear/excluir/remover.
- Com três vagas, um participante sem anexos sai e perde acesso ao quadro.
- Com duas vagas, a saída é bloqueada com mensagem.
- Criadora remove um terceiro participante sem anexos; tarefas permanecem.
- Participante com anexos não sai até removê-los.
- Cancelar exclusão não altera nada; confirmar remove apenas o grupo escolhido.
- Conta removida perde acesso após atualização. Outros quadros e contas continuam.
- Excluir grupo com anexos limpa os arquivos; se houver falha, repetir limpeza.

A conta externa e os fluxos autenticados não foram acessados nesta entrega.
Authenticated path: UNVERIFIED.
