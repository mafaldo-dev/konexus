import React from "react";
import {
  AlertTriangle,
  Building2,
  Inbox,
  Loader2,
  LockKeyhole,
  PackageX,
  RefreshCw,
  ServerCrash,
} from "lucide-react";

export type DataStateVariant =
  | "loading"
  | "empty"
  | "error"
  | "forbidden"
  | "module-not-contracted"
  | "company-required"
  | "unavailable"
  | "unexpected";

interface DataStateProps {
  variant: DataStateVariant;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

const CONTENT: Record<
  DataStateVariant,
  { title: string; description: string; icon: React.ElementType }
> = {
  loading: {
    title: "Carregando...",
    description: "Aguarde enquanto os dados são carregados.",
    icon: Loader2,
  },
  empty: {
    title: "Não há dados disponíveis.",
    description: "Cadastre o primeiro registro para começar.",
    icon: Inbox,
  },
  error: {
    title: "Erro de comunicação.",
    description: "Não foi possível carregar os dados. Tente novamente.",
    icon: ServerCrash,
  },
  forbidden: {
    title: "Acesso negado.",
    description: "Seu perfil não possui permissão para acessar este conteúdo.",
    icon: LockKeyhole,
  },
  "module-not-contracted": {
    title: "Módulo não contratado.",
    description:
      "Este módulo não está disponível para a empresa. Fale com o suporte para tratar da contratação.",
    icon: PackageX,
  },
  "company-required": {
    title: "Empresa não selecionada.",
    description: "Selecione um CNPJ para consultar os dados.",
    icon: Building2,
  },
  unavailable: {
    title: "Funcionalidade não disponível.",
    description:
      "Esta funcionalidade ainda não está disponível nesta versão do Konexus.",
    icon: PackageX,
  },
  unexpected: {
    title: "Falha inesperada.",
    description: "Não foi possível exibir esta tela.",
    icon: AlertTriangle,
  },
};

/**
 * Estado único para carregamento, vazio, erro, acesso e contratação.
 *
 * A ausência de registros é um estado normal (`empty`). Erros de API usam
 * `error` e nunca são convertidos em lista vazia.
 */
export function DataState({
  variant,
  description,
  actionLabel,
  onAction,
  compact = false,
}: DataStateProps) {
  const content = CONTENT[variant];
  const Icon = content.icon;
  const isLoading = variant === "loading";

  return (
    <div
      role={variant === "loading" ? "status" : "alert"}
      className={`flex flex-col items-center justify-center text-center text-gray-600 ${
        compact ? "px-4 py-8" : "px-6 py-14"
      }`}
    >
      {isLoading ? (
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-slate-700" />
      ) : (
        <Icon
          className={`mb-3 h-8 w-8 ${
            variant === "empty" ? "text-gray-400" : "text-slate-500"
          }`}
        />
      )}
      <p className="font-semibold text-gray-800">{content.title}</p>
      <p className="mt-1 max-w-xl text-sm text-gray-500">
        {description || content.description}
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          {actionLabel || "Tentar novamente"}
        </button>
      )}
    </div>
  );
}
