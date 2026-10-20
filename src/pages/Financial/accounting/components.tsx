/**
 * pages/Financial/accounting/components.tsx
 * Componentes compartilhados do modulo de Contabilidade.
 *
 * Seguem o padrao visual do ERP: layout `Dashboard` (menu lateral + cabecalho),
 * `DynamicTable` nas listagens e os componentes de `components/dashboard/components/ui`.
 */

import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";

import Dashboard from "../../../components/dashboard/Dashboard";
import { Button } from "../../../components/dashboard/components/ui/Button";
import {
  Card as CardBase,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/dashboard/components/ui/Card";
import { Input } from "../../../components/dashboard/components/ui/Input";
import { Modal as BaseModal } from "../../../components/dashboard/components/ui/Modal";
import { Badge } from "../../../components/dashboard/components/ui/Badge";
import { DynamicTable } from "../../../utils/Table/DynamicTable";

export function formatMoney(value: number | string | null | undefined): string {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

/**
 * Pagina do modulo: fica dentro do layout base (menu lateral + cabecalho),
 * com trilha de navegacao para voltar ao Financeiro.
 */
export function AccountingPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50/50">
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              <Link
                to="/financer/financial"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Financeiro
              </Link>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <span className="px-2 py-1 text-slate-500">Contabilidade</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <span className="px-2 py-1 font-medium text-slate-900">{title}</span>
            </nav>

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
                {description ? (
                  <p className="text-slate-600 mt-1 max-w-3xl">{description}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              ) : null}
            </div>

            {children}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}

/**
 * Card do modulo (mesmo visual do ERP).
 */
export function AccountingCard({
  title,
  description,
  children,
  className = "",
  contentClassName = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <CardBase className={`border border-slate-200 ${className}`}>
      {title || description ? (
        <CardHeader className="pb-3">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? (
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={
          contentClassName || (title || description ? "pt-0" : "p-6 pt-6")
        }
      >
        {children}
      </CardContent>
    </CardBase>
  );
}

export const Card = AccountingCard;

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-rose-700",
  };

  return (
    <CardBase className="border border-slate-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </CardBase>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-500">
      <Search className="h-7 w-7 text-slate-300" />
      <p className="font-medium text-slate-600">{message}</p>
    </div>
  );
}

const BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  success: "default",
  approved: "default",
  reconciled: "default",
  posted: "default",
  open: "default",
  true: "default",
  draft: "secondary",
  pending: "secondary",
  warning: "secondary",
  divergent: "destructive",
  rejected: "destructive",
  denied: "destructive",
  reversed: "destructive",
  cancelled: "destructive",
  expired: "destructive",
  closed: "outline",
  locked: "destructive",
  inactive: "outline",
  false: "outline",
  standard: "outline",
};

export function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, { text: string; className?: string }>;
}) {
  const config = labels[status] || { text: status };
  const variant = BADGE_VARIANTS[status] || "outline";

  return (
    <Badge variant={variant} className={config.className}>
      {config.text}
    </Badge>
  );
}

/**
 * Listagem no padrao de tabela do projeto (DynamicTable).
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription = "Ajuste os filtros para ver outros resultados",
}: {
  columns: Array<{
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    className?: string;
  }>;
  rows: T[];
  rowKey?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  return (
    <DynamicTable
      data={rows}
      columns={columns as any}
      width="100%"
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      onRowClick={onRowClick ? (row: any) => onRowClick(row) : undefined}
    />
  );
}

/**
 * Botao de acao (usa o Button do projeto).
 */
export function ActionButton({
  children,
  onClick,
  variant = "outline",
  disabled,
  title,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: (event?: any) => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  const variants: Record<string, { variant: "default" | "outline" | "ghost"; className: string }> = {
    primary: { variant: "default", className: "" },
    outline: { variant: "outline", className: "" },
    ghost: { variant: "ghost", className: "" },
    danger: { variant: "outline", className: "border-rose-300 text-rose-700 hover:bg-rose-50" },
  };

  const config = variants[variant];

  const button = (
    <Button
      type={type}
      variant={config.variant}
      size="sm"
      onClick={onClick as any}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );

  return title ? <span title={title}>{button}</span> : button;
}

/**
 * Modal do modulo (usa o Modal do projeto).
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <BaseModal isOpen={open} onClose={onClose} title={title} size={wide ? "large" : "default"}>
      <div className="space-y-4">
        {children}
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </label>
  );
}

/**
 * Link com aparencia de botao do projeto.
 */
export const linkButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2";

export const inputClass =
  "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export { Input };

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="border-t border-slate-100 p-4">{children}</div>
      ) : null}
    </div>
  );
}
