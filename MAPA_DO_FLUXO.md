# Como as informações circulam

## 1. A tela não é o banco

`src/app/page.tsx` monta `Kambambam`. É como a porta de entrada da casa.
O componente `Kambambam` guarda o estado da tela: usuário, quadro selecionado,
lista de tarefas e mensagem de erro. O banco continua na sua conta externa.

## 2. Pai → filho: props

```text
page.tsx
  └─ Kambambam (estado principal)
      └─ KanbanBoard (recebe state)
          └─ KanbanColumn (recebe label, count e children)
              └─ KanbanCard (recebe card e attachment)
                  └─ Attachment (recebe dados do anexo)
```

`KanbanBoard` não cria uma segunda cópia do banco. Recebe o snapshot do pai
por `state`. Cada tarefa recebe seu objeto `card` e, se houver, um `attachment`.

## 3. Filho → pai: callback

Ao salvar uma tarefa, `KanbanCard` chama a operação e depois `onChanged()`.
Essa função veio do pai. Ela chama `refresh()` no Kambambam, busca um snapshot
novo e usa `setState` para atualizar a tela. React renderiza os filhos com
novas props. O filho não precisa importar nem "entrar" no estado do pai.

Irmãos não conversam diretamente: quando uma tarefa muda de coluna, o pai
recebe o novo snapshot. Cada coluna filtra a mesma lista atualizada de tarefas.

## 4. Tela → servidor → banco

```text
Clique em Adicionar
  → estado local title
  → features/boards.request('add_card', ...)
  → fetch POST /api/kambambam com token (se houver)
  → getUser valida a identidade
  → RPC kambambam_operar valida acesso e limites
  → INSERT no banco
  → resposta para tela
  → refresh e setState
  → filhos recebem props novas
```

O servidor não aceita um userId declarado pela tela. Obtém o ID do token validado.
A chave secreta só existe no servidor; a chave pública não libera acesso privado.
SQL bloqueia chamadas diretas à RPC por anon/authenticated, evitando personificação.

## 5. Upload é diferente de salvar texto

```text
Escolher arquivo
  → verificar tamanho/formato
  → POST /api/kambambam/upload
  → reservar uma linha de anexo com cota atômica
  → enviar os bytes ao Storage
  → marcar linha como ready
  → atualizar snapshot
```

Link não usa bytes no Storage, mas ocupa a mesma vaga em anexos. Cada card tem
uma restrição UNIQUE: não cabe segundo anexo. Pending conta na cota para impedir
uploads concorrentes de excederem o limite. Falha normal tenta limpar reserva;
um encerramento abrupto pode exigir manutenção manual.

## 6. Arquivos por responsabilidade

- app/: entrada, layout, redefinição de senha e endpoints de servidor.
- components/: interface; cada componente com index.tsx e styles.css.
- features/auth/: chamadas de login, cadastro e recuperação.
- features/boards/: requisição compartilhada com token.
- features/groups/: ações de convites e membros.
- features/attachments/: envio, links, remoção e download.
- lib/: clientes de conexão, validação e contexto seguro da API.
- types/: formatos TypeScript. Tipo não executa consulta nem cria tabela.
- database/: SQL e instruções de Storage. Não executam ao rodar npm install.

## JavaScript → TypeScript

`useState('')` é o mesmo hook que você conhece. Em `useState<User|null>(null)`,
a parte `<User|null>` apenas documenta e verifica os valores aceitos no editor.
`Promise<T>` descreve o resultado assíncrono; não muda o funcionamento de await.
Os comentários estão nos pontos de fluxo e segurança, não repetindo a sintaxe
óbvia de cada linha. Leia um caminho completo antes de estudar os demais.
