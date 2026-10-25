import { apiClient } from '../api/client';
import { DraftScope } from './salesDrafts';

export type DomainReservationStatus = 'active' | 'consumed' | 'cancelled';
export type DomainReservation = {
  id: string;
  domain: string;
  scopeId: number;
  legalEntityId: number;
  status: DomainReservationStatus;
  effectiveStatus: DomainReservationStatus | 'expired';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  consumedAt: string | null;
  consumedAfterExpiry: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  deviceId: number;
  deviceName: string | null;
  userId: number;
  userName?: string | null;
  targetId: number | null;
  targetIds: number[];
  targetCount: number;
};

export type DomainReservationEndpoint = {
  path: string;
  label: string;
};

export const DOMAIN_RESERVATION_ENDPOINTS = {
  crm: { path: 'crm-activities', label: 'Atividades CRM' },
  training: { path: 'training-enrollments', label: 'Inscrições em treinamento' },
  receivable: { path: 'financial-receivables', label: 'Títulos a receber' },
  payable: { path: 'financial-payables', label: 'Contas a pagar' },
  payroll: { path: 'payroll-competencies', label: 'Competências de folha' },
  accounting: { path: 'accounting-periods', label: 'Períodos contábeis' },
  purchase: { path: 'purchase-orders', label: 'Pedidos de compra' },
} as const;

const changed = () => window.dispatchEvent(new Event('konexus:domain-reservations-changed'));

const errorMessage = (response: { error?: string | null }, fallback: string) =>
  response.error || fallback;

export async function listAllDomainReservations(
  scope: DraftScope,
  path: string
): Promise<DomainReservation[]> {
  const response = await apiClient.get(`offline-reservations/${path}/all`, {
    legalEntityId: scope.legalEntityId,
    reauth: false,
  });
  if (!response.ok || response.data?.success !== true) {
    throw new Error(errorMessage(response, 'Não foi possível listar as reservas desta organização.'));
  }
  return Array.isArray(response.data.data) ? response.data.data as DomainReservation[] : [];
}

export async function reconcileDomainReservation(
  scope: DraftScope,
  path: string,
  reservationId: string,
  reason: string
): Promise<DomainReservation> {
  if (!navigator.onLine) {
    throw new Error('A reconciliação da reserva exige conexão com a autoridade central.');
  }
  if (!reason?.trim() || reason.trim().length < 5) {
    throw new Error('Informe um motivo com pelo menos 5 caracteres.');
  }
  const response = await apiClient.post(
    `offline-reservations/${path}/${reservationId}/reconcile`,
    { reason: reason.trim() },
    { legalEntityId: scope.legalEntityId, reauth: true }
  );
  if (!response.ok || response.data?.success !== true) {
    throw new Error(errorMessage(response, 'O servidor não reconciliou a reserva. O alvo continua reservado.'));
  }
  changed();
  return response.data.data as DomainReservation;
}

export function canReconcileDomainReservation(
  reservation: Pick<DomainReservation, 'status'>
): boolean {
  return reservation.status === 'active';
}
