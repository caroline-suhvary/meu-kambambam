# Bucket privado — sua conta

1. No seu projeto, abra Storage e crie o bucket `kambambam-anexos`.
2. Mantenha **Public bucket DESLIGADO**.
3. Configure tamanho máximo de arquivo em **1 MB** (1048576 bytes).
4. Não crie políticas de INSERT/UPDATE/DELETE para anon ou authenticated.
5. Se o bucket já existir com 10 MB, altere para 1 MB. Confirme que está privado.
6. Não reutilize um bucket com políticas antigas permissivas. Remova essas políticas
   exclusivamente neste bucket, ou use um projeto novo para este protótipo.

A API usa a chave secreta SOMENTE no servidor para enviar/remover arquivos e
emitir URLs temporárias de download. Nenhum arquivo é enviado ao banco SQL.
O banco guarda nome, caminho, tamanho e pessoa que enviou.

Não faça INSERT/DELETE direto em storage.objects para gerenciar arquivos.
Use a interface Storage ou a API Storage; o código fornecido faz isso.
