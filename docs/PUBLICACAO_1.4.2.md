# Publicação 1.4.2 — execução de 21/10/2026

## Autorização

O usuário autorizou aplicar a migração 014, publicar o backend e o frontend e
promover a release 1.4.2.

## Executado antes da tag

- Backup completo do Neon em formato `pg_dump` custom, permissão `0600`, sem envio
  ao repositório, restaurado com sucesso em banco temporário local.
- Migração aditiva `014_explicit_legal_entity_access.sql` aplicada no Neon com
  transação única. Resultado: `INSERT 0 0`, pois todos os contribuidores
  existentes já possuíam vínculo ativo com o CNPJ principal.
- Conferência pós-migração: 9 organizações, 9 CNPJs principais ativos, 16
  contribuidores, 16 vínculos explícitos, zero contribuintes sem vínculo ativo e
  9 administradores ativos.
- Backend: 142 testes no relatório completo, 140 aprovados, 2 integrações
  ignoradas sem banco multi-CNPJ, zero falhas.
- Autorização/CNPJ: 15/15 subtests. Multi-CNPJ: 12/12.
- Frontend: 78/78, Electron/update 24/24, TypeScript limpo e build aprovado.

## Cadeia de publicação

A release 1.4.2 exige backend 1.4.2 e a migração 014. O backend é publicado no
Render antes da tag do frontend. O workflow Windows valida os testes, o
TypeScript, os artefatos e confirma `/health/release` com versão e commit exatos
antes de promover a release para `latest`.

## Resultados remotos

- Backend 1.4.2 publicado no Render no commit
  `fc45cba581329df05cec93bb7e9ff526a602e087`.
- `/health/release` confirmou HTTP 200, versão `1.4.2`, `ready=true` e o commit
  acima.
- Release do aplicativo e workflow Windows: em andamento.
