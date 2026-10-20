import { PlanType, SubscriptionStatus, SupportStatus } from "../../services/systemAdminService";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrencyFromCents(
  cents: number | null | undefined,
  currency = "BRL"
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format((cents || 0) / 100);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

/**
 * Datas puras do PostgreSQL (colunas DATE) não devem passar por conversão de
 * fuso horário, senão o dia pode aparecer um dia antes no Brasil.
 */
export function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return formatDate(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  pending: "Pendente",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export const supportStatusLabel: Record<SupportStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};

export const planTypeLabel: Record<PlanType, string> = {
  monthly: "Mensal",
  yearly: "Anual",
};

export function subscriptionTone(status: SubscriptionStatus | null | undefined) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "cancelled":
    case "expired":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function supportTone(status: SupportStatus | null | undefined) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "suspended":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}
