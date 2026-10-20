/**
 * Regras de crédito aplicadas à liberação de pedidos de venda.
 *
 * O Financeiro faz parte do freemium, mas a análise de crédito continua
 * valendo: um pedido com análise em análise (pendente) ou reprovada não pode
 * ser liberado. Estas funções são o único ponto de decisão e são usadas pela
 * tela de pedidos e pelos testes.
 *
 * Observação: quando o pedido não possui análise registrada, o pedido não é
 * bloqueado (mantendo o comportamento já existente); a tela apenas informa
 * que a análise não existe, em vez de chamar o pedido de "isento".
 */

export type CreditAnalysisStatus = "pending" | "approved" | "rejected" | "exempt";

export interface CreditAnalysis {
  status: CreditAnalysisStatus;
  score?: number;
  limit?: number;
  analyzedAt?: string;
  analyzedBy?: string;
  notes?: string;
}

export type CreditTone = "neutral" | "approved" | "rejected" | "pending";

export interface CreditStatusView {
  label: string;
  tone: CreditTone;
}

/** O pedido tem análise registrada e ela não é de aprovação. */
export function blocksOrderRelease(
  credit?: CreditAnalysis | null
): boolean {
  if (!credit) return false;
  return credit.status !== "approved" && credit.status !== "exempt";
}

/** O pedido está liberado para separação. */
export function isCreditReleased(credit?: CreditAnalysis | null): boolean {
  return !blocksOrderRelease(credit);
}

/** O pedido foi marcado explicitamente como isento de análise. */
export function isCreditExempt(credit?: CreditAnalysis | null): boolean {
  return credit?.status === "exempt";
}

/** Rótulo e cor do crédito para exibição na listagem. */
export function getCreditStatusView(
  credit?: CreditAnalysis | null
): CreditStatusView {
  if (!credit) {
    return { label: "Sem análise", tone: "neutral" };
  }

  switch (credit.status) {
    case "approved":
      return { label: "Aprovado", tone: "approved" };
    case "rejected":
      return { label: "Bloqueado", tone: "rejected" };
    case "exempt":
      return { label: "Isento", tone: "neutral" };
    default:
      return { label: "Pendente", tone: "pending" };
  }
}
