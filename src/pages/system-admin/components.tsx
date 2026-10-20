import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "./utils";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-500",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-400",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
  };
  const sizes = { sm: "h-9 px-3 text-xs", md: "h-10 px-4 text-sm" };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-[92px] resize-y", className)} {...props} />;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "pl-10")}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-admin-modal-title"
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="system-admin-modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        className
      )}
    >
      {label}
    </span>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "violet" | "amber" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={cn("rounded-xl p-2.5 ring-1", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Alert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "success" | "info";
}) {
  const config = {
    error: { class: "border-rose-200 bg-rose-50 text-rose-700", Icon: AlertCircle },
    success: {
      class: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: CheckCircle2,
    },
    info: { class: "border-blue-200 bg-blue-50 text-blue-700", Icon: Info },
  }[variant];
  const Icon = config.Icon;

  return (
    <div className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm", config.class)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <div className="rounded-2xl bg-white p-3 text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function CompanyAvatar({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white",
        className
      )}
    >
      {letters || "?"}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "bg-blue-500",
}: {
  value: number;
  max: number;
  tone?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${percent}%` }} />
    </div>
  );
}
