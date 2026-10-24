# Publicação 1.4.3 — execução de 24/10/2026

## Autorização

O usuário autorizou aplicar as migrations 019/020 no Neon, fazer o merge e
publicar a release. A rotação das credenciais Neon foi explicitamente adiada
("veremos") e **não** foi executada.

## Executado antes da tag

- Backup completo do Neon em formato `pg_dump` custom, permissão `0600`, mantido
  fora do repositório: 601.431 bytes, SHA-256
  `fdaba989285d577f1ecb222a9792ee0be41ad169f8e0f5482dd1c106f0b49cb5`.
- O dump foi restaurado com sucesso em banco temporário local
  (`konexus_neon_restore_validate`) antes de qualquer alteração em produção.
- As migrations `019_offline_sales_drafts.sql` e
  `020_stock_reservations.sql` foram preflightadas nessa restauração e depois
  aplicadas em sequência no Neon, cada uma em sua transação.
- Conferência pós-migração no Neon: tabelas `sales_draft_versions`,
  `order_submission_keys`, `stock_reservations` e `stock_reservation_items`
  presentes; coluna `stock_reservation_id`, índices e triggers de escopo
  presentes. Contagens preservadas: 9 organizações, 9 CNPJs, 10 pedidos, 2
  estações e 17 contribuidores.
- O banco temporário de validação foi removido após o preflight.

## Cadeia de publicação

1. Backend `1.4.3` preparado e testado (**188/188**) no commit
   `fa1678ee45216f4e4532f6e03ed5644c638ac3a7`, com fast-forward para `main` e
   deploy no Render.
2. `/health/release` confirmou HTTP 200, versão `1.4.3`, `ready=true` e o commit
   acima antes da tag do frontend.
3. Frontend `1.4.3` preparado no commit
   `29c8bc34fab50795ded6df4511686eca03231cda`: **146/146** testes, Electron
   **46/46**, `npm audit` zero e build aprovados.
4. Metadados `docs/releases/1.4.3.backend.json` e notas
   `docs/releases/1.4.3.md` foram incluídos antes da tag.
5. A tag `v1.4.3` foi criada no commit acima e o workflow
   [Release Windows installer #40110305595](https://github.com/mafaldo-dev/konexus/actions/runs/40110305595)
   concluiu com sucesso.

## Resultados remotos

- Backend: `1.4.3`, `ready=true`, commit
  `fa1678ee45216f4e4532f6e03ed5644c638ac3a7`.
- Release pública em 24/10/2026 16:15:13 UTC, sem rascunho e sem pré-release:
  [v1.4.3](https://github.com/mafaldo-dev/konexus/releases/tag/v1.4.3).
- Tag `v1.4.3` no commit `29c8bc34fab50795ded6df4511686eca03231cda`.
- Assets publicados e verificados:

| Asset | Tamanho | Verificação |
| --- | ---: | --- |
| `Konexus-Setup-1.4.3.exe` | 208.952.720 bytes | asset `uploaded`; tamanho e SHA-512 do `latest.yml` |
| `Konexus-Setup-1.4.3.exe.blockmap` | 219.212 bytes | asset `uploaded` |
| `latest.yml` | 343 bytes | versão 1.4.3, path/URL/tamanho/SHA-512 consistentes |

`sha512` do instalador:

```text
AZfOakvMhTt3UNGtEOQZSAyLbDneTjNWoSoME6EjogcbgN71RagEXUXbu/4DX5Tdmqy55A09IfZ2U2mpLFztUA==
```

Auditoria independente do fluxo de atualização:

```text
node scripts/audit-update-flow.mjs --tag v1.4.3
OK release: v1.4.3
latest.yml: versão/path/url/tamanho/sha512 consistentes
UpdateInfo runtime: Konexus-Setup-1.4.3.exe (208952720 bytes)
```

## Validação e limites

- A migração de produção foi aplicada após backup e restauração de validação.
  Não houve alteração de dados existentes; as tabelas novas são aditivas.
- O fluxo de reserva/pedido offline foi homologado no Linux contra PostgreSQL
  real, incluindo concorrência, perda de ACK, reinício, replay idempotente,
  expiração e cancelamento.
- O smoke Windows instalado valida instalação, cofre, SQLite, rascunho e backup;
  ele não executa reserva/pedido offline contra API/PostgreSQL.
- Não foi executado smoke autenticado com credenciais reais de produção.
- O instalador Windows permanece sem assinatura de código; o SmartScreen pode
  exibir aviso.
- Não houve pentest externo nem homologação legal/eSocial completa.
- **A rotação das credenciais Neon expostas continua pendente** e depende de
  coordenação com Render/Neon para atualizar o segredo sem interromper a
  produção.
