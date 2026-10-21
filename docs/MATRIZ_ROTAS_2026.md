# Inventário estático de rotas e entidades

Gerado por `node scripts/audit-inventory.mjs`. Cobertura da matriz não comprova execução HTTP, autorização ou persistência.
Testes HTTP/PostgreSQL cobrem login, logout, computadores, CRM e reautenticação; há também teste SQL de baixa financeira concorrente (ver relatórios). Demais linhas exigem validação por operação.

| Método | Rota API | Módulo / operação | Reautenticação | Fonte |
|---|---|---|---|---|
| POST | `/login/auth` | Sessão | Isenta justificada | auth.routes.js:10 |
| POST | `/login/auth-employee` | Sessão | Isenta justificada | auth.routes.js:11 |
| POST | `/login/logout` | Sessão | Isenta justificada | auth.routes.js:14 |
| GET | `/login/session` | Leitura | Não / leitura | auth.routes.js:15 |
| POST | `/audit/reauth` | Sessão | Isenta justificada | audit.routes.js:40 |
| GET | `/audit/events` | Leitura | Não / leitura | audit.routes.js:48 |
| GET | `/audit/events/:id` | Leitura | Não / leitura | audit.routes.js:56 |
| GET | `/audit/stations` | Leitura | Não / leitura | audit.routes.js:65 |
| POST | `/audit/stations` | audit.station_create | Sim | audit.routes.js:73 |
| PATCH | `/audit/stations/:id` | audit.station_update | Sim | audit.routes.js:81 |
| POST | `/audit/stations/:id/pairing` | audit.station_pairing | Sim | audit.routes.js:89 |
| GET | `/audit/stations/:id/tokens` | Leitura | Não / leitura | audit.routes.js:97 |
| DELETE | `/audit/stations/:id/tokens` | audit.station_tokens_revoke | Sim | audit.routes.js:105 |
| GET | `/crm/dashboard` | Leitura | Não / leitura | crm.routes.js:11 |
| GET | `/crm/history/:kind/:id` | Leitura | Não / leitura | crm.routes.js:12 |
| GET | `/crm/stages` | Leitura | Não / leitura | crm.routes.js:13 |
| GET | `/crm/owners` | Leitura | Não / leitura | crm.routes.js:14 |
| GET | `/crm/customers` | Leitura | Não / leitura | crm.routes.js:15 |
| POST | `/crm/stages` | crm.stages.create | Sim | crm.routes.js:16 |
| GET | `/crm/leads` | Leitura | Não / leitura | crm.routes.js:17 |
| POST | `/crm/leads` | crm.leads.create | Sim | crm.routes.js:18 |
| PATCH | `/crm/leads/:id` | crm.leads.update | Sim | crm.routes.js:19 |
| GET | `/crm/opportunities` | Leitura | Não / leitura | crm.routes.js:20 |
| POST | `/crm/opportunities` | crm.opportunities.create | Sim | crm.routes.js:21 |
| PATCH | `/crm/opportunities/:id` | crm.opportunities.update | Sim | crm.routes.js:22 |
| GET | `/crm/activities` | Leitura | Não / leitura | crm.routes.js:23 |
| POST | `/crm/activities` | crm.activities.create | Sim | crm.routes.js:24 |
| POST | `/crm/activities/:id/complete` | crm.activity.complete | Sim | crm.routes.js:25 |
| POST | `/devices/register` | Sessão | Isenta justificada | device.routes.js:8 |
| POST | `/devices/heartbeat` | Sessão | Isenta justificada | device.routes.js:11 |
| PATCH | `/devices/:id` | audit.device_update | Sim | device.routes.js:15 |
| POST | `/devices/:id/revoke` | audit.device_revoke | Sim | device.routes.js:19 |
| GET | `/devices` | Leitura | Não / leitura | device.routes.js:27 |
| GET | `/devices/:id/sessions` | Leitura | Não / leitura | device.routes.js:30 |
| GET | `/accounting/accounts` | Leitura | Não / leitura | accounting.routes.js:30 |
| GET | `/accounting/accounts/:id` | Leitura | Não / leitura | accounting.routes.js:33 |
| POST | `/accounting/accounts` | contabil.account_create | Sim | accounting.routes.js:36 |
| PUT | `/accounting/accounts/:id` | contabil.account_update | Sim | accounting.routes.js:39 |
| DELETE | `/accounting/accounts/:id` | contabil.account_delete | Sim | accounting.routes.js:42 |
| GET | `/accounting/cost-centers` | Leitura | Não / leitura | accounting.routes.js:47 |
| POST | `/accounting/cost-centers` | contabil.cost_center_create | Sim | accounting.routes.js:50 |
| PUT | `/accounting/cost-centers/:id` | contabil.cost_center_update | Sim | accounting.routes.js:53 |
| GET | `/accounting/periods` | Leitura | Não / leitura | accounting.routes.js:58 |
| POST | `/accounting/periods` | contabil.period_create | Sim | accounting.routes.js:61 |
| POST | `/accounting/periods/:id/close` | contabil.period_close | Sim | accounting.routes.js:64 |
| POST | `/accounting/periods/:id/reopen` | contabil.period_reopen | Sim | accounting.routes.js:67 |
| POST | `/accounting/periods/:id/lock` | contabil.period_lock | Sim | accounting.routes.js:70 |
| GET | `/accounting/entries` | Leitura | Não / leitura | accounting.routes.js:75 |
| GET | `/accounting/entries/:id` | Leitura | Não / leitura | accounting.routes.js:78 |
| POST | `/accounting/entries` | contabil.entry_create | Sim | accounting.routes.js:81 |
| PUT | `/accounting/entries/:id` | contabil.entry_update | Sim | accounting.routes.js:84 |
| POST | `/accounting/entries/:id/post` | contabil.entry_post | Sim | accounting.routes.js:87 |
| POST | `/accounting/entries/:id/reverse` | contabil.entry_reverse | Sim | accounting.routes.js:90 |
| DELETE | `/accounting/entries/:id` | contabil.entry_delete | Sim | accounting.routes.js:93 |
| GET | `/accounting/mappings` | Leitura | Não / leitura | accounting.routes.js:98 |
| POST | `/accounting/mappings` | contabil.mapping_save | Sim | accounting.routes.js:101 |
| DELETE | `/accounting/mappings/:id` | contabil.mapping_delete | Sim | accounting.routes.js:104 |
| GET | `/accounting/settings` | Leitura | Não / leitura | accounting.routes.js:109 |
| PUT | `/accounting/settings` | contabil.settings_save | Sim | accounting.routes.js:112 |
| GET | `/accounting/reports/available` | Leitura | Não / leitura | accounting.routes.js:117 |
| GET | `/accounting/dashboard` | Leitura | Não / leitura | accounting.routes.js:120 |
| GET | `/accounting/reports/journal` | Leitura | Não / leitura | accounting.routes.js:123 |
| GET | `/accounting/reports/ledger` | Leitura | Não / leitura | accounting.routes.js:126 |
| GET | `/accounting/reports/trial-balance` | Leitura | Não / leitura | accounting.routes.js:129 |
| GET | `/accounting/reports/balance-sheet` | Leitura | Não / leitura | accounting.routes.js:132 |
| GET | `/accounting/reports/income-statement` | Leitura | Não / leitura | accounting.routes.js:135 |
| GET | `/accounting/integration/pending` | Leitura | Não / leitura | accounting.routes.js:140 |
| POST | `/accounting/integration/events` | contabil.integration_event | Sim | accounting.routes.js:143 |
| GET | `/accounting/reconciliations` | Leitura | Não / leitura | accounting.routes.js:148 |
| POST | `/accounting/reconciliations` | contabil.reconciliation_save | Sim | accounting.routes.js:151 |
| POST | `/accounting/reconciliations/:id/unreconcile` | contabil.reconciliation_undo | Sim | accounting.routes.js:154 |
| GET | `/accounting/assets` | Leitura | Não / leitura | accounting.routes.js:159 |
| POST | `/accounting/assets` | contabil.asset_create | Sim | accounting.routes.js:162 |
| PUT | `/accounting/assets/:id` | contabil.asset_update | Sim | accounting.routes.js:165 |
| GET | `/accounting/depreciations` | Leitura | Não / leitura | accounting.routes.js:168 |
| POST | `/accounting/periods/:id/depreciation` | contabil.depreciation_run | Sim | accounting.routes.js:171 |
| GET | `/admin/system/dashboard` | Leitura | Não / leitura | system-admin.routes.js:13 |
| GET | `/admin/system/companies` | Leitura | Não / leitura | system-admin.routes.js:15 |
| POST | `/admin/system/companies` | admin.company_create | Sim | system-admin.routes.js:16 |
| GET | `/admin/system/companies/:companyId` | Leitura | Não / leitura | system-admin.routes.js:17 |
| GET | `/admin/system/extra-modules` | Leitura | Não / leitura | system-admin.routes.js:20 |
| GET | `/admin/system/companies/:companyId/extra-modules` | Leitura | Não / leitura | system-admin.routes.js:23 |
| PUT | `/admin/system/companies/:companyId/extra-modules/:moduleKey` | admin.extra_module_update | Sim | system-admin.routes.js:26 |
| GET | `/admin/system/companies/:companyId/module-events` | Leitura | Não / leitura | system-admin.routes.js:29 |
| GET | `/admin/system/authorizations` | Leitura | Não / leitura | system-admin.routes.js:34 |
| POST | `/admin/system/authorizations` | admin.authorization_create | Sim | system-admin.routes.js:37 |
| POST | `/admin/system/authorizations/:authorizationId/revoke` | admin.authorization_revoke | Sim | system-admin.routes.js:40 |
| GET | `/admin/system/subscriptions` | Leitura | Não / leitura | system-admin.routes.js:44 |
| POST | `/admin/system/subscriptions` | admin.subscription_create | Não / leitura | system-admin.routes.js:45 |
| PUT | `/admin/system/subscriptions/:subscriptionId` | admin.subscription_update | Não / leitura | system-admin.routes.js:46 |
| GET | `/admin/system/plans` | Leitura | Não / leitura | system-admin.routes.js:50 |
| POST | `/admin/system/plans` | admin.plan_create | Não / leitura | system-admin.routes.js:51 |
| PUT | `/admin/system/plans/:planId` | admin.plan_update | Não / leitura | system-admin.routes.js:52 |
| GET | `/admin/system/plans/:planId/modules` | Leitura | Não / leitura | system-admin.routes.js:53 |
| POST | `/admin/system/plans/:planId/modules` | admin.plan_module_create | Não / leitura | system-admin.routes.js:56 |
| DELETE | `/admin/system/plans/:planId/modules/:moduleKey` | admin.plan_module_delete | Não / leitura | system-admin.routes.js:59 |
| GET | `/admin/system/modules` | Leitura | Não / leitura | system-admin.routes.js:63 |
| GET | `/admin/system/support` | Leitura | Não / leitura | system-admin.routes.js:65 |
| PUT | `/admin/system/support/:companyId` | admin.support_update | Sim | system-admin.routes.js:68 |
| POST | `/admin/create-company` | admin.company_setup | Não / leitura | company.routes.js:10 |
| GET | `/admin/companie/:companyId` | Leitura | Não / leitura | company.routes.js:14 |
| PATCH | `/admin/companie/:companyId` | gestao.company_update | Sim | company.routes.js:15 |
| POST | `/admin/upload-logo` | gestao.company_logo_upload | Não / leitura | company.routes.js:25 |
| DELETE | `/admin/logo/:filename` | gestao.company_logo_delete | Não / leitura | company.routes.js:33 |
| POST | `/products/create` | gestao.product_create | Sim | product.routes.js:11 |
| GET | `/products/all` | Leitura | Não / leitura | product.routes.js:19 |
| GET | `/products/:id` | Leitura | Não / leitura | product.routes.js:31 |
| PUT | `/products/:id` | gestao.product_update | Sim | product.routes.js:42 |
| PUT | `/products/:id/stock` | estoque.product_stock | Sim | product.routes.js:50 |
| DELETE | `/products/:id` | gestao.product_delete | Sim | product.routes.js:58 |
| POST | `/employees/create` | rh.employee_create | Sim | employee.routes.js:22 |
| GET | `/employees/all` | Leitura | Não / leitura | employee.routes.js:31 |
| PUT | `/employees/:id` | rh.employee_update | Sim | employee.routes.js:40 |
| DELETE | `/employees/:id` | rh.employee_delete | Sim | employee.routes.js:49 |
| PUT | `/employees/:id/status` | rh.employee_status | Sim | employee.routes.js:58 |
| GET | `/employees/:id/status` | Leitura | Não / leitura | employee.routes.js:66 |
| POST | `/collaborators/me/change-password` | gestao.collaborator_change_password | Não / leitura | collaborator.routes.js:18 |
| GET | `/collaborators/permissions/catalog` | Leitura | Não / leitura | collaborator.routes.js:25 |
| GET | `/collaborators/overview` | Leitura | Não / leitura | collaborator.routes.js:35 |
| GET | `/collaborators/usage` | Leitura | Não / leitura | collaborator.routes.js:42 |
| GET | `/collaborators/authorizations` | Leitura | Não / leitura | collaborator.routes.js:50 |
| GET | `/collaborators/events` | Leitura | Não / leitura | collaborator.routes.js:58 |
| GET | `/collaborators/password-resets` | Leitura | Não / leitura | collaborator.routes.js:66 |
| GET | `/collaborators/roles` | Leitura | Não / leitura | collaborator.routes.js:75 |
| POST | `/collaborators/roles` | gestao.role_create | Sim | collaborator.routes.js:82 |
| PUT | `/collaborators/roles/:roleId` | gestao.role_update | Sim | collaborator.routes.js:89 |
| PATCH | `/collaborators/roles/:roleId/status` | gestao.role_status | Sim | collaborator.routes.js:96 |
| GET | `/collaborators` | Leitura | Não / leitura | collaborator.routes.js:105 |
| POST | `/collaborators` | gestao.collaborator_create | Sim | collaborator.routes.js:112 |
| GET | `/collaborators/:id/permissions` | Leitura | Não / leitura | collaborator.routes.js:119 |
| PUT | `/collaborators/:id/permissions` | gestao.collaborator_permissions | Sim | collaborator.routes.js:126 |
| POST | `/collaborators/:id/reset-password` | gestao.collaborator_reset_password | Sim | collaborator.routes.js:133 |
| PUT | `/collaborators/:id` | gestao.collaborator_update | Sim | collaborator.routes.js:140 |
| DELETE | `/collaborators/:id` | gestao.collaborator_delete | Sim | collaborator.routes.js:147 |
| POST | `/suppliers/create` | gestao.supplier_create | Sim | supplier.routes.js:8 |
| GET | `/suppliers/all` | Leitura | Não / leitura | supplier.routes.js:16 |
| GET | `/suppliers/:id` | Leitura | Não / leitura | supplier.routes.js:24 |
| PUT | `/suppliers/:id` | gestao.supplier_update | Sim | supplier.routes.js:32 |
| DELETE | `/suppliers/:id` | gestao.supplier_delete | Sim | supplier.routes.js:40 |
| POST | `/customers/create` | gestao.customer_create | Sim | customer.routes.js:8 |
| GET | `/customers/all` | Leitura | Não / leitura | customer.routes.js:16 |
| PUT | `/customers/:id` | gestao.customer_update | Sim | customer.routes.js:24 |
| DELETE | `/customers/:id` | gestao.customer_delete | Sim | customer.routes.js:32 |
| POST | `/orders/create` | vendas.create | Sim | order.routes.js:8 |
| GET | `/orders/all` | Leitura | Não / leitura | order.routes.js:16 |
| GET | `/orders/last-number` | Leitura | Não / leitura | order.routes.js:24 |
| GET | `/orders/edit/:id` | Leitura | Não / leitura | order.routes.js:32 |
| GET | `/orders/customers/list` | Leitura | Não / leitura | order.routes.js:40 |
| GET | `/orders/:id` | Leitura | Não / leitura | order.routes.js:48 |
| PUT | `/orders/:id` | vendas.update | Sim | order.routes.js:56 |
| PUT | `/orders/:id/status` | vendas.status | Sim | order.routes.js:64 |
| PATCH | `/orders/:id/cancel` | vendas.cancel | Sim | order.routes.js:72 |
| DELETE | `/orders/:id` | vendas.delete | Sim | order.routes.js:80 |
| POST | `/purchase/create` | compras.create | Sim | purchase.routes.js:8 |
| GET | `/purchase/all` | Leitura | Não / leitura | purchase.routes.js:16 |
| GET | `/purchase/:orderNumber` | Leitura | Não / leitura | purchase.routes.js:24 |
| PUT | `/purchase/:id` | compras.update | Sim | purchase.routes.js:32 |
| DELETE | `/purchase/:id` | compras.delete | Sim | purchase.routes.js:40 |
| POST | `/kardex/create` | estoque.movement_create | Sim | kardex.routes.js:8 |
| GET | `/kardex/products/:productId` | Leitura | Não / leitura | kardex.routes.js:16 |
| GET | `/kardex/orders/:orderId` | Leitura | Não / leitura | kardex.routes.js:24 |
| POST | `/invoice/create` | compras.invoice_create | Sim | invoice.routes.js:8 |
| GET | `/invoice/in/:order_id` | Leitura | Não / leitura | invoice.routes.js:16 |
| POST | `/service/create` | gestao.service_order_create | Sim | service-order.routes.js:8 |
| GET | `/service/all` | Leitura | Não / leitura | service-order.routes.js:16 |
| GET | `/service/:id/os` | Leitura | Não / leitura | service-order.routes.js:24 |
| PATCH | `/service/:id/os` | gestao.service_order_update | Sim | service-order.routes.js:32 |
| POST | `/nfe/:orderId/emitir` | nfe.emit | Sim | nfe.routes.js:14 |
| GET | `/nfe/all` | Leitura | Não / leitura | nfe.routes.js:23 |
| GET | `/nfe/:nfeId/danfe` | Leitura | Não / leitura | nfe.routes.js:32 |
| GET | `/nfe/:nfeId/status` | Leitura | Não / leitura | nfe.routes.js:41 |
| GET | `/message/:userId/:recipientId` | Leitura | Não / leitura | message.routes.js:9 |
| GET | `/message/:userId/recent` | Leitura | Não / leitura | message.routes.js:10 |
| GET | `/message/:userId/unread` | Leitura | Não / leitura | message.routes.js:11 |
| PUT | `/message/:messageId/read` | gestao.message_read | Não / leitura | message.routes.js:12 |
| PUT | `/message/:userId/read-all/:senderId` | gestao.message_read_all | Não / leitura | message.routes.js:13 |
| DELETE | `/message/:messageId` | gestao.message_delete | Não / leitura | message.routes.js:14 |
| GET | `/payments/dashboard` | Leitura | Não / leitura | payment.routes.js:21 |
| GET | `/payments/all` | Leitura | Não / leitura | payment.routes.js:29 |
| GET | `/payments/customer/:id/payments` | Leitura | Não / leitura | payment.routes.js:37 |
| GET | `/payments/:id` | Leitura | Não / leitura | payment.routes.js:45 |
| PUT | `/payments/:orderId/status` | financeiro.payment_status | Sim | payment.routes.js:53 |
| PUT | `/payments/:id/mark-payd` | financeiro.payment_mark_paid | Sim | payment.routes.js:61 |
| GET | `/payment/accounts` | Leitura | Não / leitura | payment-account.routes.js:17 |
| GET | `/payment/accounts/summary` | Leitura | Não / leitura | payment-account.routes.js:25 |
| GET | `/payment/accounts/:id` | Leitura | Não / leitura | payment-account.routes.js:33 |
| POST | `/payment/accounts` | financeiro.account_create | Sim | payment-account.routes.js:41 |
| PUT | `/payment/accounts/:id` | financeiro.account_update | Sim | payment-account.routes.js:49 |
| DELETE | `/payment/accounts/:id` | financeiro.account_delete | Sim | payment-account.routes.js:57 |
| GET | `/plugnotas/config` | Leitura | Não / leitura | plugnotas-config.routes.js:13 |
| POST | `/plugnotas/config` | nfe.config_save | Sim | plugnotas-config.routes.js:21 |
| POST | `/plugnotas/config/test` | nfe.config_test | Não / leitura | plugnotas-config.routes.js:29 |
| PATCH | `/plugnotas/config/toggle` | nfe.config_toggle | Sim | plugnotas-config.routes.js:37 |
| DELETE | `/plugnotas/config` | nfe.config_delete | Sim | plugnotas-config.routes.js:45 |
| GET | `/subscription/plans` | Leitura | Não / leitura | subscription.routes.js:21 |
| GET | `/subscription/plans/:planId` | Leitura | Não / leitura | subscription.routes.js:22 |
| GET | `/subscription/plans/:planId/modules` | Leitura | Não / leitura | subscription.routes.js:23 |
| POST | `/subscription/plans` | admin.plan_legacy_create | Não / leitura | subscription.routes.js:24 |
| PUT | `/subscription/plans/:planId` | admin.plan_legacy_update | Não / leitura | subscription.routes.js:25 |
| POST | `/subscription/plans/:planId/modules` | admin.plan_legacy_module_create | Não / leitura | subscription.routes.js:26 |
| DELETE | `/subscription/plans/:planId/modules/:moduleKey` | admin.plan_legacy_module_delete | Não / leitura | subscription.routes.js:27 |
| GET | `/subscription` | Leitura | Não / leitura | subscription.routes.js:31 |
| GET | `/subscription/active-modules` | Leitura | Não / leitura | subscription.routes.js:32 |
| GET | `/subscription/access/:moduleKey` | Leitura | Não / leitura | subscription.routes.js:33 |
| DELETE | `/subscription` | admin.subscription_legacy_cancel | Não / leitura | subscription.routes.js:34 |
| GET | `/subscription/:companyId` | Leitura | Não / leitura | subscription.routes.js:43 |
| POST | `/subscription` | admin.subscription_legacy_create | Não / leitura | subscription.routes.js:46 |
| PUT | `/subscription/:subscriptionId` | admin.subscription_legacy_update | Não / leitura | subscription.routes.js:47 |

Total: 208 rotas literais detectadas. Rotas dinâmicas/Socket.IO não são cobertas pelo extrator.

## Rotas da interface

- `/`
- `/system-admin`
- `/change-password`
- `/sales/orders`
- `/sales/order-list`
- `/sales/newOrder`
- `/sales/orders/edit/:id`
- `/sales/completed`
- `/sales/goals`
- `/sales/comissions`
- `/sales/reports`
- `/manager/products`
- `/manager/customer`
- `/manager/suppliers`
- `/manager/categories`
- `/manager/services`
- `/shopping/purchase-order`
- `/shopping/purchase-requisition`
- `/shopping/invoice-entry`
- `/financer/financial`
- `/financial/order-nfe`
- `/rh/employee`
- `/rh/infos`
- `/stock/inventory`
- `/dashboard`
- `/crm`
- `/config/users-permissions`
- `/financer/contabilidade/painel`
- `/financer/contabilidade/plano-de-contas`
- `/financer/contabilidade/lancamentos`
- `/financer/contabilidade/livro-diario`
- `/financer/contabilidade/livro-razao`
- `/financer/contabilidade/balancete`
- `/financer/contabilidade/balanco-patrimonial`
- `/financer/contabilidade/demonstracao-resultado`
- `/financer/contabilidade/conciliacao`
- `/financer/contabilidade/exercicios`
- `/financer/contabilidade/ativos`
- `/financer/contabilidade/relatorios`
- `/financer/contabilidade/configuracoes`
- `/config/security-area`
- `/config/audit-log`
- `/config/stations`
- `/config/notifications`
- `/config/system`
- `/config/companies`
- `/planos`
- `*`

## Entidades referenciadas em SQL (candidatas, não esquema introspectado)

- `accounting_accounts`: accountingAssetRepository.js, accountingEntryRepository.js, accountingRepository.js
- `accounting_cost_centers`: accountingAssetRepository.js, accountingEntryRepository.js, accountingRepository.js
- `accounting_depreciations`: accountingAssetRepository.js
- `accounting_entries`: accountingAssetRepository.js, accountingEntryRepository.js, accountingRepository.js
- `accounting_entry_items`: accountingEntryRepository.js, accountingRepository.js
- `accounting_fixed_assets`: accountingAssetRepository.js
- `accounting_mappings`: accountingRepository.js
- `accounting_origin_events`: accountingEntryRepository.js
- `accounting_periods`: accountingAssetRepository.js, accountingEntryRepository.js, accountingRepository.js
- `accounting_reconciliations`: accountingAssetRepository.js
- `accounting_settings`: accountingRepository.js
- `addresses`: customerRepository.js, orderRepository.js
- `administrator`: authRepository.js
- `audit_events`: auditRepository.js, crmRepository.js, deviceRepository.js, reauthRepository.js, sessionRepository.js
- `com`: accountingRepository.js
- `commercial_authorizations`: collaboratorRepository.js, systemAdminRepository.js
- `companies`: authRepository.js, collaboratorRepository.js, companyRepository.js, plugnotasConfigRepository.js, subscriptionRepository.js, systemAdminRepository.js
- `company_extra_modules`: authRepository.js, collaboratorRepository.js, subscriptionRepository.js, systemAdminRepository.js
- `company_module_events`: collaboratorRepository.js, systemAdminRepository.js
- `company_roles`: authRepository.js, collaboratorRepository.js
- `contributor`: accountingAssetRepository.js, accountingEntryRepository.js, authRepository.js, collaboratorRepository.js, companyRepository.js, crmRepository.js, employeeRepository.js, serviceOrderRepository.js, systemAdminRepository.js
- `contributor_events`: collaboratorRepository.js
- `contributor_permission_overrides`: authRepository.js, collaboratorRepository.js
- `crm_activities`: crmRepository.js
- `crm_leads`: crmRepository.js
- `crm_opportunities`: crmRepository.js
- `crm_stages`: crmRepository.js
- `customers`: accountingFinancialRepository.js, crmRepository.js, customerRepository.js, orderRepository.js, paymentRepository.js
- `device_installations`: deviceRepository.js
- `ended`: deviceRepository.js, sessionRepository.js
- `inserted`: productRepository.js
- `installation_modules`: authRepository.js
- `invoices`: invoiceRepository.js
- `kardex`: invoiceRepository.js, kardexRepository.js, serviceOrderRepository.js
- `lateral`: deviceRepository.js
- `messages`: messageRepository.js
- `modules`: authRepository.js, collaboratorRepository.js, systemAdminRepository.js
- `order_payments`: accountingFinancialRepository.js, orderRepository.js, paymentRepository.js
- `orderitems`: orderRepository.js
- `orders`: accountingFinancialRepository.js, kardexRepository.js, orderRepository.js, paymentRepository.js
- `orderservice`: kardexRepository.js, serviceOrderRepository.js
- `orderserviceitems`: serviceOrderRepository.js
- `ordersrequest`: kardexRepository.js, purchaseOrderRepository.js
- `password_reset_events`: collaboratorRepository.js
- `payment_account`: accountingFinancialRepository.js, paymentAccountRepository.js
- `plan_modules`: subscriptionRepository.js
- `plans`: subscriptionRepository.js, systemAdminRepository.js
- `plugnotas_config`: plugnotasConfigRepository.js
- `products`: invoiceRepository.js, kardexRepository.js, orderRepository.js, productRepository.js, purchaseOrderRepository.js, serviceOrderRepository.js
- `purchaseorderitems`: invoiceRepository.js, purchaseOrderRepository.js
- `reauth_grants`: reauthRepository.js
- `recorded`: auditRepository.js
- `role_permissions`: authRepository.js, collaboratorRepository.js
- `s`: reauthRepository.js
- `started`: sessionRepository.js
- `subscriptions`: subscriptionRepository.js, systemAdminRepository.js
- `suppliers`: productRepository.js, purchaseOrderRepository.js, supplierRepository.js
- `support_contracts`: systemAdminRepository.js
- `touched`: deviceRepository.js
- `user_sessions`: auditRepository.js, deviceRepository.js, sessionRepository.js
- `work_station_tokens`: stationRepository.js
- `work_stations`: deviceRepository.js, stationRepository.js
