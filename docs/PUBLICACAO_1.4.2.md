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
  contribuidores, 16 vínculos explícitos, zero contribuidores sem vínculo ativo e
  9 administradores ativos.
- Backend: 142 testes no relatório completo, 140 aprovados, 2 integrações
  ignoradas sem banco multi-CNPJ, zero falhas.
- Autorização/CNPJ: 15/15 subtests. Multi-CNPJ: 12/12.
- Frontend: 78/78, Electron 24/24, fluxo de atualização 21/21, TypeScript limpo
  e build aprovado.

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
- Frontend 1.4.2 commitado em `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80` e
  tagueado como `v1.4.2`.
- Workflow [Release Windows installer #39675888429](https://github.com/mafaldo-dev/konexus/actions/runs/39675888429)
  concluído com sucesso em 21/10/2026.
- Release pública em 21/10/2026 21:11:40 UTC, marcada como `latest`, sem rascunho
  e sem pré-release:
  [v1.4.2](https://github.com/mafaldo-dev/konexus/releases/tag/v1.4.2).
- Assets publicados e verificados:

| Asset | Tamanho | Verificação |
| --- | ---: | --- |
| `Konexus-Setup-1.4.2.exe` | 215.013.010 bytes | asset `uploaded`; SHA-512 do `latest.yml` |
| `Konexus-Setup-1.4.2.exe.blockmap` | 224.453 bytes | asset `uploaded` |
| `latest.yml` | 343 bytes | versão 1.4.2, path/URL/tamanho/SHA-512 consistentes |

`sha512` do instalador:

```text
H1jbAg7aRQaNpMiQdCs+j+VC9lRcotdBGnAmApuJDdwLdqnB9PLBwjsBscj94sulYMfie0HoJ1J22BwLQl+x0Q==
```

- Auditoria independente do fluxo de atualização (`node scripts/audit-update-flow.mjs --tag v1.4.2`):
  release pública selecionada, `latest.yml` consistente com o instalador e
  `UpdateInfo` em runtime apontando para `Konexus-Setup-1.4.2.exe`.

## Validação e limites

- A migração de produção foi aplicada após backup e restauração de validação; a
  conferência de dados terminou sem inconsistências.
- A autorização foi validada por testes de integração locais com PostgreSQL real,
  incluindo reautenticação, revogação em sessão viva e isolamento de CNPJ.
- Não foi executado um smoke autenticado com credenciais reais de produção nem a
  instalação/atualização in-place em uma estação Windows. Esses dois pontos
  continuam exigindo validação humana.
- O instalador Windows permanece sem assinatura de código; o SmartScreen pode
  exibir aviso.
