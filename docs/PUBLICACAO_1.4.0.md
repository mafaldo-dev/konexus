# Publicação 1.4.0 — execução de 21/10/2026

## Autorização
Após solicitar a publicação, o usuário autorizou explicitamente produção: atualizar
backend e aplicar somente as migrações aditivas 011/012 antes do autoUpdater.
Essa autorização posterior substitui a restrição de produção registrada nos relatórios
históricos. O escopo funcional incompleto continua identificado no plano dos módulos.

## Executado antes da tag
- Testes: backend 131, frontend 75, Electron/workflow 24 aprovados.
- TypeScript e build frontend aprovados; permanecem warnings legados.
- Backup completo do banco, formato pg_dump custom, arquivo local 0600; verificado
  com pg_restore --list. Nenhum dado do backup é enviado ao GitHub.
- Migrações 011 e 012 aplicadas em produção com sucesso, transacionais e aditivas.
- Backend enviado ao main: `a57b9b08d91cce66f64d4198ecadcaa9885413e4`.
- Implantação confirmada: `/health/release` respondeu HTTP 200, versão 1.4.0,
  ready=true e commit correspondente. `/login/session`, `/devices` e `/crm/dashboard`
  responderam 401 sem credenciais; preflight CORS do Electron respondeu 204/origem null.
- Frontend preparado como 1.4.0, com lockfile/versão/notas alinhados.

## Cadeia de publicação
Tag v1.4.0 → runner Windows → testes/NSIS → verificação local de SHA-512 e arquivos
→ upload em draft → download e comparação dos bytes → backend 1.4.0 pronto no
commit esperado → promoção para latest → auditoria do download público.

Referências: [notas da versão](releases/1.4.0.md) e
[contrato de compatibilidade](releases/1.4.0.backend.json).

## Resultados remotos
O estado remoto final deve ser verificado no workflow e nos assets publicados;
preparação local não é evidência de publicação. A confirmação final será registrada
após a execução do GitHub Actions e validação do download público.
