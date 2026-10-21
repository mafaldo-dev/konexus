# Publicação 1.4.1 — execução de 21/10/2026

## Autorização

Após a migração e os testes autorizados, o usuário autorizou commitar os dois
repositórios e publicar a release 1.4.1.

## Executado antes da tag

- Backup completo do Neon em formato `pg_dump` custom, permissão `0600`, sem envio
  ao repositório.
- Migração aditiva `013_multi_cnpj.sql` aplicada no Neon.
- Validação de produção: 9 organizações, 9 empresas jurídicas principais, zero
  vínculos operacionais nulos, zero CNPJs duplicados e 21 triggers corretos.
- Smoke test transacional com rollback confirmou o preenchimento do CNPJ em
  `payment_account` e `product_stock`, sem registros residuais.
- Backend: 140 testes, 139 aprovados, 1 ignorado, zero falhas.
- Multi-CNPJ: 12 testes, 12 aprovados.
- Frontend: 75 testes, 24 testes Electron, TypeScript e build aprovados.
- Backend 1.4.1 publicado no Render: commit
  `a19c54236aaa3506bf6a8a3d75388966aa9eac4b`, `/health/release` com
  `ready=true`, incluindo a verificação das estruturas da migração 013.

## Cadeia de publicação

Tag `v1.4.1` no commit `04f1091fccd1d1537fd95f4544c85a42c11cfe18` →
workflow Windows → testes/gates → instalador NSIS → verificação de artefatos →
upload em rascunho → download e comparação SHA-512 → confirmação do backend
1.4.1 no commit esperado → promoção para `latest`.

## Resultados remotos

Concluído em 21/10/2026.

- Workflow GitHub Actions `39662471278` concluído com **success**:
  https://github.com/mafaldo-dev/konexus/actions/runs/39662471278
- Release pública, sem rascunho e sem pré-lançamento:
  https://github.com/mafaldo-dev/konexus/releases/tag/v1.4.1
- `latest` público aponta para `v1.4.1`.
- Backend: https://backend-oi68.onrender.com/health/release responde HTTP 200,
  versão `1.4.1`, `ready=true`, commit
  `a19c54236aaa3506bf6a8a3d75388966aa9eac4b`.

### Assets publicados

| Arquivo | Tamanho |
|---|---|
| Konexus-Setup-1.4.1.exe | 214.997.734 bytes |
| Konexus-Setup-1.4.1.exe.blockmap | 224.888 bytes |
| latest.yml | 343 bytes |

### Verificação do download público

`node scripts/audit-update-flow.mjs --tag v1.4.1` confirmou:

- `latest.yml` declara `version: 1.4.1`, caminho, URL, tamanho e SHA-512
  consistentes.
- `UpdateInfo` do runtime seleciona `Konexus-Setup-1.4.1.exe` com
  214.997.734 bytes.
- SHA-512:
  `44weupRiYIvXsBi3lKEhXeo6B9p+EYoiq8XSCwjlZC1EBm1j4/ONl0myLTKZRsNwsZ4Ah9q54oi4ifD6jtPy3A==`.
- O login e o processo principal não abrem a página HTML da release.

## Escopo e limites

A release entrega a base operacional multi-CNPJ descrita em
[`releases/1.4.1.md`](releases/1.4.1.md). Permanecem pendentes: conversão de
oportunidade CRM em pedido, snapshot local imutável de NF-e/faturas, banner
dedicado do emissor nos formulários de compra/ordem de serviço/fatura,
disponibilidade/preço/faturamento por CNPJ na interface, motor de crédito,
devoluções, folha homologada, eSocial, FGTS e SPED.

## Validação humana pendente

O instalador é **não assinado**; o Windows pode exibir aviso do SmartScreen. A
instalação real em uma estação Windows e a atualização automática in-place ainda
devem ser conferidas por uma pessoa. O `.exe` foi produzido no runner oficial
`windows-latest`, não no ambiente Linux local.
