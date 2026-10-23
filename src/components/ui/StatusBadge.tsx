import type React from "react";

const TONES: Record<string, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
  purple: "border-violet-200 bg-violet-50 text-violet-700",
};

export type BadgeTone = keyof typeof TONES;

export function StatusBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}

export function Alert({
  tone = "red",
  children,
}: {
  tone?: "red" | "amber" | "blue" | "green";
  children: React.ReactNode;
}) {
  const classes = {
    red: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];
  return (
    <div className={`rounded-lg border p-3 text-sm ${classes}`} role="alert">
      {children}
    </div>
  );
}

export function formatMoney(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(
    value.includes("T") ? value : `${String(value).slice(0, 10)}T12:00:00`
  );
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthInput(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) {
    const now = new Date();
    return monthBounds(
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  const last = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

export function idempotencyKey(prefix: string): string {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : null;
  const random = cryptoApi?.randomUUID
    ? cryptoApi.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}
