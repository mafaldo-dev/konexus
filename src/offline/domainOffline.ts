import { apiClient } from '../api/client';
import { DraftScope, nativeCall, nativeStorage } from './salesDrafts';

export type DomainKey =
  | 'financial_receivable'
  | 'financial_payable'
  | 'payroll_competency'
  | 'accounting_period'
  | 'purchase_order' | 'crm_activity' | 'training_enrollment' | 'stock_movement' | 'purchase_return';
export type DomainAction = 'settle' | 'close' | 'reopen' | 'lock' | 'approve' | 'complete' | 'attend' | 'absent' | 'entry' | 'exit' | 'adjust' | 'transfer' | 'receive';
export type DomainReservationState = 'active' | 'queued' | 'consumed' | 'cancelled' | 'blocked';
export type DomainOperationState = 'pending' | 'leased' | 'blocked' | 'confirmed';

export type DomainTarget = {
  domain: DomainKey;
  targetId: number;
  label: string;
  secondary: string | null;
  status: string;
  amount: number | null;
  dueDate: string | null;
  reference: string | null;
};

export type DomainSnapshot = {
  domain: DomainKey;
  targets: DomainTarget[];
  updatedAt: number;
};

export type DomainLocalReservation = {
  allocation?: { action?: DomainAction; quantity?: number; productId?: number; direction?: string; destinationLegalEntityId?: number | null; items?: Array<{productId:number;quantity:number}> };
  id: string;
  reservationId: string;
  companyId: number;
  legalEntityId: number;
  userId: number;
  domain: DomainKey;
  targetId: number;
  deviceId: number;
  deviceName: string | null;
  expiresAt: string;
  status: DomainReservationState;
  effectiveStatus: DomainReservationState | 'expired';
  expired: boolean;
  operationId: string | null;
  errorCode: string | null;
  createdAt: number;
  updatedAt: number;
};

export type DomainOperation = {
  operationId: string;
  companyId: number;
  legalEntityId: number;
  userId: number;
  domain: DomainKey;
  action: DomainAction;
  targetId: number;
  reservationId: string;
  state: DomainOperationState;
  attempts: number;
  errorCode: string | null;
  serverStatus: string | null;
  createdAt: number;
  updatedAt: number;
  confirmedAt: number | null;
};

export type DomainOperationPayload = {
  grade?: number | null;
  notes?: string;
  paymentDate?: string;
  transactionId?: string;
};

type ClaimedDomainOperation = {
  operationId: string;
  domain: DomainKey;
  action: DomainAction;
  targetId: number;
  reservationId: string;
  leaseToken: string;
  payload: DomainOperationPayload;
  reservationToken: string;
};

type DomainConfig = {
  path: string;
  label: string;
  listEndpoint: string;
};

export const DOMAIN_OFFLINE_CONFIG: Record<DomainKey, DomainConfig> = {
  stock_movement: { path: 'stock-movements', label: 'Estoque e transferências', listEndpoint: 'offline-reservations/stock-movements/targets' },
  purchase_return: { path: 'purchase-returns', label: 'Devoluções de compra', listEndpoint: 'offline-reservations/purchase-returns/targets' },
  crm_activity: { path: 'crm-activities', label: 'Atividades CRM', listEndpoint: 'offline-reservations/crm-activities/targets' },
  training_enrollment: { path: 'training-enrollments', label: 'Inscrições em treinamento', listEndpoint: 'offline-reservations/training-enrollments/targets' },
  financial_receivable: {
    path: 'financial-receivables',
    label: 'Títulos a receber',
    listEndpoint: 'payments/all?limit=200',
  },
  financial_payable: {
    path: 'financial-payables',
    label: 'Contas a pagar',
    listEndpoint: 'payment/accounts?limit=200',
  },
  payroll_competency: {
    path: 'payroll-competencies',
    label: 'Competências de folha',
    listEndpoint: 'rh/payroll/competencies',
  },
  accounting_period: {
    path: 'accounting-periods',
    label: 'Períodos contábeis',
    listEndpoint: 'accounting/periods',
  },
  purchase_order: {
    path: 'purchase-orders',
    label: 'Pedidos de compra',
    listEndpoint: 'purchase/all?limit=200',
  },
};

const RECEIVABLE_STATUSES = ['pending', 'overdue', 'due_today'];
const PAYABLE_STATUSES = ['pending', 'overdue'];
const PAYROLL_STATUSES = ['open', 'calculated', 'approved'];
const ACCOUNTING_STATUSES = ['open', 'closed'];
const PURCHASE_ORDER_STATUSES = ['pending'];

const changed = () => {
  window.dispatchEvent(new Event('konexus:domain-offline-changed'));
  window.dispatchEvent(new Event('konexus:domain-reservations-changed'));
};
const requireDesktop = () => {
  if (!nativeStorage()) {
    throw new Error('As operações offline por setor exigem o aplicativo desktop com SQLite protegido.');
  }
};
const errorMessage = (response: { error?: string | null }, fallback: string) =>
  response.error || fallback;
const numberOrNull = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const textOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};
const dateOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text || null;
};

function normalizeReceivable(row: any): DomainTarget | null {
  if (!row || !RECEIVABLE_STATUSES.includes(String(row.payment_status))) return null;
  const targetId = Number(row.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return null;
  const secondary = [textOrNull(row.customer_name), textOrNull(row.ordernumber)]
    .filter(Boolean)
    .join(' · ');
  return {
    domain: 'financial_receivable',
    targetId,
    label: `Título #${targetId}`,
    secondary: secondary || null,
    status: String(row.payment_status),
    amount: numberOrNull(row.amount),
    dueDate: dateOrNull(row.due_date),
    reference: textOrNull(row.ordernumber) || textOrNull(row.transaction_id),
  };
}

function normalizePayable(row: any): DomainTarget | null {
  if (!row || !PAYABLE_STATUSES.includes(String(row.payment_status))) return null;
  const targetId = Number(row.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return null;
  return {
    domain: 'financial_payable',
    targetId,
    label: textOrNull(row.title) || `Conta #${targetId}`,
    secondary: textOrNull(row.supplier),
    status: String(row.payment_status),
    amount: numberOrNull(row.total_amount),
    dueDate: dateOrNull(row.payment_date),
    reference: `#${targetId}`,
  };
}

function normalizePayroll(row: any): DomainTarget | null {
  if (!row || !PAYROLL_STATUSES.includes(String(row.status))) return null;
  const targetId = Number(row.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return null;
  const employeeCount = Number(row.employee_count);
  return {
    domain: 'payroll_competency',
    targetId,
    label: `Competência ${String(row.label || targetId)}`,
    secondary: Number.isFinite(employeeCount) ? `${employeeCount} colaborador(es)` : null,
    status: String(row.status),
    amount: numberOrNull(row.net_total),
    dueDate: dateOrNull(row.period_end),
    reference: textOrNull(row.label),
  };
}

function normalizePurchaseOrder(row: any): DomainTarget | null {
  const status = String(row?.orderStatus ?? row?.orderstatus ?? '');
  if (!row || !PURCHASE_ORDER_STATUSES.includes(status)) return null;
  const targetId = Number(row.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return null;
  const orderNumber = textOrNull(row.orderNumber ?? row.ordernumber);
  return {
    domain: 'purchase_order',
    targetId,
    label: orderNumber ? `Pedido ${orderNumber}` : `Pedido de compra #${targetId}`,
    secondary: textOrNull(row.supplierName ?? row.suppliername),
    status,
    amount: numberOrNull(row.totalCost ?? row.totalcost),
    dueDate: dateOrNull(row.orderDate ?? row.orderdate),
    reference: orderNumber || `#${targetId}`,
  };
}

function normalizeAccounting(row: any, scope: DraftScope): DomainTarget | null {
  if (!row || !ACCOUNTING_STATUSES.includes(String(row.status))) return null;
  if (Number(row.legal_entity_id) !== Number(scope.legalEntityId)) return null;
  const targetId = Number(row.id);
  if (!Number.isSafeInteger(targetId) || targetId <= 0) return null;
  const month = Number(row.fiscal_month);
  const year = Number(row.fiscal_year);
  return {
    domain: 'accounting_period',
    targetId,
    label: textOrNull(row.name) || `${String(month).padStart(2, '0')}/${year}`,
    secondary: `Exercício ${year}`,
    status: String(row.status),
    amount: null,
    dueDate: dateOrNull(row.ends_at),
    reference: `#${targetId}`,
  };
}

async function fetchTargets(scope: DraftScope, domain: DomainKey): Promise<DomainTarget[]> {
  const config = DOMAIN_OFFLINE_CONFIG[domain];
  const response = await apiClient.get(config.listEndpoint, {
    legalEntityId: scope.legalEntityId,
    reauth: false,
  });
  if (!response.ok) {
    throw new Error(errorMessage(response, `Não foi possível carregar ${config.label.toLowerCase()} da central.`));
  }
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows
    .map((row: any) =>
      domain === 'crm_activity' || domain === 'training_enrollment' || domain === 'stock_movement' || domain === 'purchase_return'
        ? { domain, targetId: Number(row.id), label: String(row.label), secondary: textOrNull(row.secondary), status: String(row.status), amount: null, dueDate: null, reference: `#${row.id}` }
        :
      domain === 'financial_receivable'
        ? normalizeReceivable(row)
        : domain === 'financial_payable'
          ? normalizePayable(row)
          : domain === 'payroll_competency'
            ? normalizePayroll(row)
            : domain === 'purchase_order'
              ? normalizePurchaseOrder(row)
              : normalizeAccounting(row, scope)
    )
    .filter((target: DomainTarget | null): target is DomainTarget => Boolean(target))
    .sort((a: DomainTarget, b: DomainTarget) => a.targetId - b.targetId);
}

export async function refreshDomainTargets(
  scope: DraftScope,
  domain: DomainKey
): Promise<DomainSnapshot> {
  if (!navigator.onLine) {
    throw new Error('Conecte-se à internet para atualizar a cópia local dos alvos.');
  }
  const targets = await fetchTargets(scope, domain);
  const updatedAt = Date.now();
  if (nativeStorage()) {
    await nativeCall('save-domain-snapshot', { scope, domain, targets });
  }
  changed();
  return { domain, targets, updatedAt };
}

export async function loadCachedDomainTargets(
  scope: DraftScope,
  domain: DomainKey
): Promise<DomainSnapshot | null> {
  if (!nativeStorage()) return null;
  return nativeCall<DomainSnapshot | null>('load-domain-snapshot', { scope, domain });
}

export async function listLocalDomainReservations(
  scope: DraftScope,
  domain?: DomainKey,
  limit = 100
): Promise<DomainLocalReservation[]> {
  if (!nativeStorage()) return [];
  return nativeCall<DomainLocalReservation[]>('list-domain-reservations', { scope, domain, limit });
}

export async function loadLocalDomainReservation(
  scope: DraftScope,
  domain: DomainKey,
  targetId: number
): Promise<DomainLocalReservation | null> {
  if (!nativeStorage()) return null;
  return nativeCall<DomainLocalReservation | null>('load-domain-reservation', { scope, domain, targetId });
}

export async function reserveDomainTarget(
  scope: DraftScope,
  domain: DomainKey,
  targetId: number,
  ttlMinutes = 24 * 60,
  allocation: { action?: DomainAction; quantity?: number; direction?: string; destinationLegalEntityId?: number } = {}
): Promise<DomainLocalReservation> {
  requireDesktop();
  if (!navigator.onLine) {
    throw new Error('Conecte-se à internet para reservar este alvo. A reserva é criada somente pela autoridade central.');
  }
  const config = DOMAIN_OFFLINE_CONFIG[domain];
  const response = await apiClient.post(
    `offline-reservations/${config.path}`,
    { ...allocation, targetId, ttlMinutes },
    { legalEntityId: scope.legalEntityId, reauth: true }
  );
  if (!response.ok || response.data?.success !== true || !response.data?.data?.id) {
    throw new Error(errorMessage(
      response,
      `Não foi possível confirmar a reserva de ${config.label.toLowerCase()}. Antes de tentar novamente, verifique as reservas desta estação; uma resposta perdida pode ter deixado o alvo retido.`
    ));
  }
  const reservation = response.data.data;
  try {
    return await nativeCall<DomainLocalReservation>('save-domain-reservation', {
      scope,
      domain,
      reservation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `A reserva ${reservation.id} foi criada na central, mas o cofre local não a salvou (${message}). ` +
      'O alvo está retido. Abra a Área de continuidade offline para reconciliar a estação.'
    );
  } finally {
    changed();
  }
}

export async function cancelDomainReservation(
  scope: DraftScope,
  domain: DomainKey,
  reservationId: string,
  reason: string
): Promise<void> {
  requireDesktop();
  if (!navigator.onLine) {
    throw new Error('A liberação da reserva exige conexão com a autoridade central.');
  }
  const config = DOMAIN_OFFLINE_CONFIG[domain];
  const response = await apiClient.post(
    `offline-reservations/${config.path}/${reservationId}/cancel`,
    { reason: reason?.trim() || undefined },
    { legalEntityId: scope.legalEntityId, reauth: true }
  );
  if (!response.ok || response.data?.success !== true) {
    throw new Error(errorMessage(response, 'O servidor não liberou a reserva. O alvo continua retido.'));
  }
  try {
    await nativeCall('cancel-domain-reservation', { scope, reservationId, force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/não encontrada/i.test(message)) {
      throw new Error(
        `A central liberou o alvo, mas a cópia local não pôde ser limpa (${message}). ` +
        'Tente liberar novamente; a reserva na central já está cancelada.'
      );
    }
  }
  changed();
}

export async function queueDomainOperation(
  scope: DraftScope,
  input: {
    domain: DomainKey;
    action: DomainAction;
    targetId: number;
    reservationId: string;
    payload: DomainOperationPayload;
  }
): Promise<DomainOperation> {
  requireDesktop();
  const operationId = crypto.randomUUID();
  const operation = await nativeCall<DomainOperation>('queue-domain-operation', {
    scope,
    operation: { ...input, operationId },
  });
  changed();
  return operation;
}

export async function listDomainOperations(
  scope: DraftScope,
  limit = 100
): Promise<DomainOperation[]> {
  if (!nativeStorage()) return [];
  return nativeCall<DomainOperation[]>('list-domain-operations', { scope, limit });
}

export async function loadDomainOperation(
  scope: DraftScope,
  operationId: string
): Promise<DomainOperation | null> {
  if (!nativeStorage()) return null;
  return nativeCall<DomainOperation | null>('load-domain-operation', { scope, operationId });
}

function operationEndpoint(operation: Pick<DomainOperation, 'domain' | 'action' | 'targetId'>): string {
  const config = DOMAIN_OFFLINE_CONFIG[operation.domain];
  return `offline-domain-operations/${config.path}/${operation.targetId}/${operation.action}`;
}

function responseErrorCode(response: { status: number; code?: string | null }): string {
  if (response.status === 401) return 'AUTH';
  if (response.status === 403) return response.code === 'DEVICE_REGISTRATION_REQUIRED' ? 'DEVICE' : 'ACCESS';
  if (response.status === 409) return 'CONFLICT';
  if (response.status === 0 || response.status === 408 || response.status === 429) return 'NETWORK';
  if (response.status >= 500) return 'SERVER';
  return 'VALIDATION';
}

let syncingDomains = false;
export async function syncDomainOperations(scope: DraftScope): Promise<void> {
  if (syncingDomains || !navigator.onLine || !nativeStorage()) return;
  syncingDomains = true;
  try {
    for (let count = 0; count < 10; count++) {
      const operations = await nativeCall<ClaimedDomainOperation[]>('claim-domain-operations', {
        scope,
        limit: 1,
      });
      const operation = operations[0];
      if (!operation) return;
      let response;
      try {
        response = await apiClient.post(
          operationEndpoint(operation),
          {
            ...operation.payload,
            clientRequestId: operation.operationId,
            reservationId: operation.reservationId,
            reservationToken: operation.reservationToken,
          },
          { legalEntityId: scope.legalEntityId, reauth: false }
        );
      } catch (error) {
        await nativeCall('reject-domain-operation', {
          scope,
          operationId: operation.operationId,
          leaseToken: operation.leaseToken,
          code: 'NETWORK',
        });
        changed();
        throw error;
      }
      const data = response.data?.data;
      const expectedStatus: Record<DomainAction,string> = {settle:'paid',close:'closed',reopen:'open',lock:'locked',approve:'approved',complete:'completed',attend:'attended',absent:'absent',entry:'completed',exit:'completed',adjust:'completed',transfer:'completed',receive:'received'};
      const confirmed =
        response.ok &&
        response.data?.success === true &&
        data &&
        data.domain === operation.domain &&
        data.action === operation.action &&
        Number(data.targetId) === Number(operation.targetId) &&
        data.reservationId === operation.reservationId &&
        data.status === expectedStatus[operation.action];
      if (confirmed) {
        await nativeCall('ack-domain-operation', {
          scope,
          operationId: operation.operationId,
          leaseToken: operation.leaseToken,
          ack: {
            domain: data.domain,
            targetId: Number(data.targetId),
            reservationId: data.reservationId,
            status: data.status,
          },
        });
        changed();
        continue;
      }
      await nativeCall('reject-domain-operation', {
        scope,
        operationId: operation.operationId,
        leaseToken: operation.leaseToken,
        code: response.ok ? 'INVALID_ACK' : responseErrorCode(response),
      });
      changed();
      return;
    }
  } finally {
    syncingDomains = false;
  }
}

export async function retryDomainOperation(
  scope: DraftScope,
  operationId: string
): Promise<DomainOperation> {
  requireDesktop();
  const operation = await nativeCall<DomainOperation>('retry-domain-operation', { scope, operationId });
  changed();
  return operation;
}

export async function resumeDomainOperations(scope: DraftScope): Promise<void> {
  if (!nativeStorage()) return;
  await nativeCall('resume-domain-auth', { scope });
  changed();
}

export function domainTargetActions(domain: DomainKey, status: string): DomainAction[] {
  if (domain === 'stock_movement') return [];
  if (domain === 'purchase_return') return status === 'approved' ? ['receive'] : status === 'pending_approval' ? ['approve'] : [];
  if (domain === 'crm_activity') return status === 'pending' ? ['complete'] : [];
  if (domain === 'training_enrollment') return status === 'attended' ? ['complete', 'absent'] : ['enrolled', 'absent'].includes(status) ? ['attend', 'absent'] : [];
  if (domain === 'financial_receivable') {
    return RECEIVABLE_STATUSES.includes(status) ? ['settle'] : [];
  }
  if (domain === 'financial_payable') {
    return PAYABLE_STATUSES.includes(status) ? ['settle'] : [];
  }
  if (domain === 'payroll_competency') {
    return status === 'approved' ? ['close'] : [];
  }
  if (domain === 'purchase_order') {
    return PURCHASE_ORDER_STATUSES.includes(status) ? ['approve'] : [];
  }
  if (status === 'open') return ['close', 'lock'];
  if (status === 'closed') return ['reopen', 'lock'];
  return [];
}

export function domainActionLabel(action: DomainAction): string {
  if (action === 'entry') return 'Registrar entrada';
  if (action === 'exit') return 'Registrar saída';
  if (action === 'adjust') return 'Registrar ajuste';
  if (action === 'transfer') return 'Transferir';
  if (action === 'receive') return 'Registrar saída da devolução';
  if (action === 'complete') return 'Concluir';
  if (action === 'attend') return 'Registrar presença';
  if (action === 'absent') return 'Registrar ausência';
  if (action === 'settle') return 'Baixar';
  if (action === 'close') return 'Fechar';
  if (action === 'reopen') return 'Reabrir';
  if (action === 'approve') return 'Aprovar';
  return 'Bloquear';
}

export function domainStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    overdue: 'Vencido',
    due_today: 'Vence hoje',
    paid: 'Pago',
    open: 'Aberto',
    calculated: 'Calculado',
    approved: 'Aprovado',
    closed: 'Fechado',
    locked: 'Bloqueado',
    enrolled: 'Inscrito',
    attended: 'Presença registrada',
    absent: 'Ausente',
    completed: 'Concluído',
  };
  return labels[status] || status;
}
