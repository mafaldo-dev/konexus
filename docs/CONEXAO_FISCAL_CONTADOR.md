# Conexão fiscal pelo contador

No aplicativo: **Contabilidade → Painel contábil → Conexão fiscal / homologação**.
Rota: `/financer/contabilidade/conexao-fiscal`. A configuração antiga em `/config/system` continua disponível.

## Acesso

- O administrador concede ao usuário do contador a permissão `nfe.configure`, acesso ao CNPJ e o módulo NF-e contratado.
- Para abrir o painel contábil, também é necessário acesso ao módulo Contabilidade e à ação `contabil.reports`.
- O nome do cargo “Contador” não concede permissões automaticamente.

## Configurar e homologar

1. Selecionar o CNPJ correto no aplicativo.
2. Cadastrar/vincular a empresa e o certificado A1 no provedor PlugNotas.
3. Na tela do Konexus, informar a chave API e selecionar **Homologação**; salvar a configuração.
4. Usar **Testar conexão com o provedor**. Pode usar a chave já salva, sem reexibi-la.
5. Conferir os dados tributários e acompanhar emissões reais de teste e seus resultados. Uma conexão bem-sucedida não é autorização de NF-e nem prova de conclusão da homologação.
6. Configurar produção somente após a validação do responsável fiscal.

Os campos de certificado da tela armazenam configuração no Konexus; não fazem upload automático para o provedor. A validade cadastrada também não equivale a validação criptográfica do certificado.

## Teste manual no Windows

Não é necessário token do GitHub nem token de CI entre repositórios. Usar login normal, CNPJ autorizado e pareamento/registro do computador para testar filas offline, reinício e sincronização. A chave API do provedor fiscal é uma credencial diferente e serve exclusivamente à integração fiscal.

Validação desta tela: build aprovado; 180 testes frontend; 13 testes backend direcionados (conexão/configuração e matriz de operações). As respostas do provedor foram substituídas apenas nos testes automatizados; nenhuma transmissão fiscal externa foi executada.
