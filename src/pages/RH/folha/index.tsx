import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Calculator,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";

import Dashboard from "../../../components/dashboard/Dashboard";
import { useAuth } from "../../../AuthContext";
import { DataState } from "../../../components/ui/DataState";
import { Modal } from "../../../components/ui/Modal";
import {
  Alert,
  StatusBadge,
  formatDate,
  formatDateTime,
  formatMoney,
  monthInput,
} from "../../../components/ui/StatusBadge";
import {
  PayrollCalculationType,
  PayrollCompensationRow,
  PayrollCompetency,
  PayrollRubric,
  PayrollRubricKind,
  PayrollStatus,
  addPayrollRubricVersion,
  approvePayroll,
  calculatePayroll,
  closePayroll,
  createPayrollCompetency,
  createPayrollEvent,
  createPayrollRubric,
  deletePayrollEvent,
  getPayrollCompetency,
  getPayrollRubric,
  listPayrollCompensations,
  listPayrollCompetencies,
  listPayrollRubrics,
  postPayrollToFinance,
  reopenPayrollCompetency,
  upsertPayrollCompensation,
} from "../../../services/payrollService";

type PayrollTab = "competencies" | "compensations" | "rubrics";

const STATUS_LABELS: Record<
  PayrollStatus,
  { label: string; tone: "slate" | "blue" | "green" | "amber" }
> = {
  open: { label: "Aberta", tone: "blue" },
  calculated: { label: "Calculada", tone: "amber" },
  approved: { label: "Aprovada", tone: "green" },
  closed: { label: "Fechada", tone: "slate" },
};

const KIND_LABELS: Record<PayrollRubricKind, string> = {
  earning: "Provento",
  deduction: "Desconto",
};

const TABS: Array<{ id: PayrollTab; label: string }> = [
  { id: "competencies", label: "Competências" },
  { id: "compensations", label: "Remunerações" },
  { id: "rubrics", label: "Rubricas versionadas" },
];

interface RubricFormState {
  code: string;
  name: string;
  kind: PayrollRubricKind;
  calculationType: PayrollCalculationType;
  rate: string;
  fixedAmount: string;
  sourceNote: string;
  sourceUrl: string;
  effectiveFrom: string;
  effectiveTo: string;
}

const EMPTY_RUBRIC: RubricFormState = {
  code: "",
  name: "",
  kind: "deduction",
  calculationType: "fixed",
  rate: "",
  fixedAmount: "",
  sourceNote: "",
  sourceUrl: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
};

interface EventFormState {
  rubricId: string;
  employmentLinkId: string;
  quantity: string;
  referenceAmount: string;
  notes: string;
}

const EMPTY_EVENT: EventFormState = {
  rubricId: "",
  employmentLinkId: "",
  quantity: "1",
  referenceAmount: "",
  notes: "",
};

export default function PayrollPage() {
  const { activeLegalEntity, hasPermission } = useAuth();
  const canView = hasPermission("rh", "view_payroll");
  const canProcess = hasPermission("rh", "process_payroll");
  const canApprove = hasPermission("rh", "approve_payroll");
  const canFinance = hasPermission("finance", "create");

  const [tab, setTab] = useState<PayrollTab>("competencies");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [rubrics, setRubrics] = useState<PayrollRubric[]>([]);
  const [compensations, setCompensations] = useState<PayrollCompensationRow[]>([]);
  const [competencies, setCompetencies] = useState<PayrollCompetency[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [competencyModalOpen, setCompetencyModalOpen] = useState(false);
  const [competencyMonth, setCompetencyMonth] = useState(monthInput());
  const [savingCompetency, setSavingCompetency] = useState(false);

  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [rubricForm, setRubricForm] = useState<RubricFormState>(EMPTY_RUBRIC);
  const [savingRubric, setSavingRubric] = useState(false);

  const [versionModalRubric, setVersionModalRubric] =
    useState<PayrollRubric | null>(null);
  const [versionForm, setVersionForm] =
    useState<Omit<RubricFormState, "code" | "name" | "kind">>({
      calculationType: "fixed",
      rate: "",
      fixedAmount: "",
      sourceNote: "",
      sourceUrl: "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
    });
  const [savingVersion, setSavingVersion] = useState(false);

  const [rubricDetail, setRubricDetail] = useState<PayrollRubric | null>(null);
  const [rubricDetailLoading, setRubricDetailLoading] = useState(false);

  const [compensationRow, setCompensationRow] =
    useState<PayrollCompensationRow | null>(null);
  const [compensationBase, setCompensationBase] = useState("");
  const [compensationSource, setCompensationSource] = useState("");
  const [compensationEffectiveFrom, setCompensationEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [savingCompensation, setSavingCompensation] = useState(false);

  const [detail, setDetail] = useState<PayrollCompetency | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>(EMPTY_EVENT);
  const [savingEvent, setSavingEvent] = useState(false);

  const legalEntityId = activeLegalEntity?.id;

  const load = useCallback(async () => {
    if (!legalEntityId) {
      setRubrics([]);
      setCompensations([]);
      setCompetencies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [rubricResponse, compensationResponse, competencyResponse] =
      await Promise.all([
        listPayrollRubrics(),
        listPayrollCompensations(),
        listPayrollCompetencies(statusFilter || undefined),
      ]);
    if (!rubricResponse.ok || !rubricResponse.data) {
      setError(
        rubricResponse.error || "Não foi possível carregar as rubricas da folha."
      );
      setRubrics([]);
    } else {
      setRubrics(rubricResponse.data);
    }
    setCompensations(
      compensationResponse.ok ? compensationResponse.data || [] : []
    );
    setCompetencies(
      competencyResponse.ok ? competencyResponse.data || [] : []
    );
    if (!competencyResponse.ok) {
      setError(
        (current) =>
          current ||
          competencyResponse.error ||
          "Não foi possível carregar as competências."
      );
    }
    setLoading(false);
  }, [legalEntityId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return {
      open: competencies.filter((item) => item.status === "open").length,
      calculated: competencies.filter((item) => item.status === "calculated")
        .length,
      approved: competencies.filter((item) => item.status === "approved").length,
      closed: competencies.filter((item) => item.status === "closed").length,
      net: competencies
        .filter((item) => item.status === "closed")
        .reduce((sum, item) => sum + Number(item.net_total), 0),
    };
  }, [competencies]);

  const compensatedLinks = useMemo(
    () => compensations.filter((row) => row.base_salary !== null),
    [compensations]
  );

  const openCompetency = async (item: PayrollCompetency) => {
    setDetail(item);
    setDetailLoading(true);
    setError(null);
    const response = await getPayrollCompetency(item.id);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível carregar a competência.");
    } else {
      setDetail(response.data);
    }
    setDetailLoading(false);
  };

  const refreshDetail = async (id: number) => {
    const response = await getPayrollCompetency(id);
    if (response.ok && response.data) setDetail(response.data);
    await load();
  };

  const createCompetency = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCompetency(true);
    setError(null);
    const response = await createPayrollCompetency(competencyMonth);
    setSavingCompetency(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível abrir a competência.");
      return;
    }
    setCompetencyModalOpen(false);
    setSuccess(
      "Competência aberta. Configure a remuneração de todos os vínculos e lance apenas rubricas com fonte e vigência."
    );
    await load();
    await openCompetency(response.data);
  };

  const openRubricDetail = async (rubric: PayrollRubric) => {
    setRubricDetail(rubric);
    setRubricDetailLoading(true);
    setError(null);
    const response = await getPayrollRubric(rubric.id);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível carregar a rubrica.");
    } else {
      setRubricDetail(response.data);
    }
    setRubricDetailLoading(false);
  };

  const submitRubric = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingRubric(true);
    setError(null);
    const response = await createPayrollRubric({
      code: rubricForm.code.trim(),
      name: rubricForm.name.trim(),
      kind: rubricForm.kind,
      calculationType: rubricForm.calculationType,
      rate: rubricForm.calculationType === "percentage" ? rubricForm.rate : undefined,
      fixedAmount:
        rubricForm.calculationType === "fixed" ? rubricForm.fixedAmount : undefined,
      sourceNote: rubricForm.sourceNote.trim(),
      sourceUrl: rubricForm.sourceUrl.trim() || undefined,
      effectiveFrom: rubricForm.effectiveFrom,
      effectiveTo: rubricForm.effectiveTo || undefined,
    });
    setSavingRubric(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível criar a rubrica.");
      return;
    }
    setRubricModalOpen(false);
    setRubricForm(EMPTY_RUBRIC);
    setSuccess(
      "Rubrica criada com versão inicial. Nenhuma alíquota legal foi presumida."
    );
    await load();
  };

  const openVersionModal = (rubric: PayrollRubric) => {
    setVersionModalRubric(rubric);
    setVersionForm({
      calculationType: rubric.calculation_type || "fixed",
      rate: rubric.rate !== null && rubric.rate !== undefined ? String(rubric.rate) : "",
      fixedAmount:
        rubric.fixed_amount !== null && rubric.fixed_amount !== undefined
          ? String(rubric.fixed_amount)
          : "",
      sourceNote: "",
      sourceUrl: "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
    });
    setError(null);
  };

  const submitVersion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!versionModalRubric) return;
    setSavingVersion(true);
    setError(null);
    const response = await addPayrollRubricVersion(versionModalRubric.id, {
      calculationType: versionForm.calculationType,
      rate:
        versionForm.calculationType === "percentage"
          ? versionForm.rate
          : undefined,
      fixedAmount:
        versionForm.calculationType === "fixed"
          ? versionForm.fixedAmount
          : undefined,
      sourceNote: versionForm.sourceNote.trim(),
      sourceUrl: versionForm.sourceUrl.trim() || undefined,
      effectiveFrom: versionForm.effectiveFrom,
      effectiveTo: versionForm.effectiveTo || undefined,
    });
    setSavingVersion(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível adicionar a versão.");
      return;
    }
    setVersionModalRubric(null);
    setSuccess("Nova vigência adicionada à rubrica.");
    await load();
    if (rubricDetail && rubricDetail.id === versionModalRubric.id) {
      await openRubricDetail(versionModalRubric);
    }
  };

  const openCompensation = (row: PayrollCompensationRow) => {
    setCompensationRow(row);
    setCompensationBase(
      row.base_salary !== null && row.base_salary !== undefined
        ? Number(row.base_salary).toFixed(2)
        : ""
    );
    setCompensationSource(row.source_note || "");
    setCompensationEffectiveFrom(
      row.effective_from?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    );
    setError(null);
  };

  const saveCompensation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!compensationRow) return;
    setSavingCompensation(true);
    setError(null);
    const response = await upsertPayrollCompensation({
      employmentLinkId: compensationRow.employment_link_id,
      baseSalary: compensationBase,
      effectiveFrom: compensationEffectiveFrom,
      sourceNote: compensationSource.trim(),
    });
    setSavingCompensation(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível salvar a remuneração.");
      return;
    }
    setCompensationRow(null);
    setSuccess("Remuneração registrada com vigência e fonte.");
    await load();
  };

  const calculate = async (item: PayrollCompetency) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Calcular competência?",
      input: "select",
      inputOptions: {managerial: "Gerencial — salário e eventos", clt_monthly_2026: "CLT mensal padrão 2026 — INSS, IRRF e FGTS"},
      inputValue: "managerial",
      text: "Escolha o modelo. O padrão CLT usa tabelas oficiais de 2026 e aceita somente salário-base integral, sem eventos.",
      showCancelButton: true,
      confirmButtonText: "Calcular",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed.isConfirmed) return;
    let options;
    if (confirmed.value === 'clt_monthly_2026') {
      const scope = await Swal.fire({
        title: 'Enquadramento CLT mensal padrão',
        text: 'Confirme: todos os vínculos são CLT ordinários, mês integral, vínculo único, sem dependentes, pensão, afastamentos, adiantamentos ou outros pagamentos no mês. Não inclui férias, 13º, rescisão, aprendiz, doméstico, encargos patronais além do FGTS ou eSocial. Informe pagamento no mesmo mês da competência.',
        input: 'date', inputValue: new Date().toISOString().slice(0,10),
        showCancelButton: true, confirmButtonText: 'Confirmar enquadramento e calcular',
        inputValidator: value => value?.slice(0,7) === item.label ? undefined : 'Informe pagamento no mês da competência.',
      });
      if (!scope.isConfirmed) return;
      options = {model:'clt_monthly_2026',paymentDate:String(scope.value),confirmStandardScope:true};
    }
    setActionLoading(true);
    setError(null);
    const response = await calculatePayroll(item.id, options);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível calcular a folha.");
      return;
    }
    setSuccess(
      "Cálculo concluído. Confira o modelo e a memória de cálculo antes de aprovar."
    );
    await refreshDetail(item.id);
  };

  const reopen = async (item: PayrollCompetency) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Reabrir cálculo?",
      text: "As linhas calculadas serão removidas e os eventos preservados. A competência volta para aberta.",
      showCancelButton: true,
      confirmButtonText: "Reabrir",
      cancelButtonText: "Voltar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await reopenPayrollCompetency(item.id);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível reabrir o cálculo.");
      return;
    }
    setSuccess("Competência reaberta para ajuste dos eventos.");
    await refreshDetail(item.id);
  };

  const approve = async (item: PayrollCompetency) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Aprovar folha?",
      text: "Depois de aprovada, a competência não pode ser recalculada. Confira as fontes das rubricas.",
      showCancelButton: true,
      confirmButtonText: "Aprovar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await approvePayroll(item.id);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível aprovar a folha.");
      return;
    }
    setSuccess("Folha aprovada. O próximo passo é o fechamento.");
    await refreshDetail(item.id);
  };

  const close = async (item: PayrollCompetency) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Fechar competência?",
      text: "O fechamento bloqueia alterações. A integração ao financeiro é manual e separada.",
      showCancelButton: true,
      confirmButtonText: "Fechar",
      cancelButtonText: "Voltar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await closePayroll(item.id);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível fechar a folha.");
      return;
    }
    setSuccess("Competência fechada. A integração financeira pode ser feita agora.");
    await refreshDetail(item.id);
  };

  const postFinance = async (item: PayrollCompetency) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Integrar ao contas a pagar?",
      text: "Será criado um único título pendente com o líquido gerencial. A operação é idempotente e não transmite eSocial.",
      showCancelButton: true,
      confirmButtonText: "Integrar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await postPayrollToFinance(item.id);
    setActionLoading(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível integrar a folha ao financeiro.");
      return;
    }
    setSuccess(
      response.data.replayed
        ? "A folha já estava integrada; nenhum título duplicado foi criado."
        : `Título pendente criado no contas a pagar (ID ${response.data.paymentAccountId}).`
    );
    await refreshDetail(item.id);
  };

  const openEventModal = () => {
    setEventForm(EMPTY_EVENT);
    setEventModalOpen(true);
    setError(null);
  };

  const submitEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setSavingEvent(true);
    setError(null);
    const response = await createPayrollEvent(detail.id, {
      rubricId: eventForm.rubricId,
      employmentLinkId: eventForm.employmentLinkId || null,
      quantity: eventForm.quantity,
      referenceAmount: eventForm.referenceAmount || null,
      notes: eventForm.notes.trim() || undefined,
    });
    setSavingEvent(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível lançar o evento.");
      return;
    }
    setEventModalOpen(false);
    setSuccess("Evento lançado na competência. Recalcule para atualizar os totais.");
    await refreshDetail(detail.id);
  };

  const removeEvent = async (
    competencyId: number,
    eventId: number,
    label: string
  ) => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Remover evento?",
      text: `O evento ${label} será removido da competência aberta.`,
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Voltar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await deletePayrollEvent(competencyId, eventId);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível remover o evento.");
      return;
    }
    setSuccess("Evento removido. Recalcule a competência.");
    await refreshDetail(competencyId);
  };

  if (!canView) {
    return (
      <Dashboard>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
            <DataState variant="forbidden" />
          </div>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/rh"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Recursos Humanos
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
              {canProcess && tab === "competencies" && (
                <button
                  type="button"
                  onClick={() => {
                    setCompetencyMonth(monthInput());
                    setCompetencyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Abrir competência
                </button>
              )}
              {canProcess && tab === "rubrics" && (
                <button
                  type="button"
                  onClick={() => {
                    setRubricForm(EMPTY_RUBRIC);
                    setRubricModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Nova rubrica
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Folha de Pagamento
                </h1>
                <p className="text-sm text-gray-600">
                  Competências, remunerações, rubricas versionadas e integração
                  gerencial com o contas a pagar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">
                Folha: modelo gerencial ou CLT mensal padrão 2026
              </p>
              <p className="mt-1 text-xs">
                O modelo CLT padrão usa fontes oficiais de 2026 e enquadramento
                mensal restrito, confirmado antes do cálculo. O modelo gerencial
                usa somente salário e eventos configurados. Confira a memória de
                cada cálculo. Esta tela não emite guias nem transmite eSocial.
              </p>
            </div>
          </div>

          {!activeLegalEntity && (
            <Alert tone="amber">
              Selecione um CNPJ no cabeçalho. Folha, remunerações e integração
              financeira são isoladas por CNPJ empregador.
            </Alert>
          )}
          {error && <Alert>{error}</Alert>}
          {success && (
            <Alert tone="green">
              <div className="flex items-center justify-between gap-3">
                <span>{success}</span>
                <button
                  type="button"
                  className="text-xs font-semibold underline"
                  onClick={() => setSuccess(null)}
                >
                  fechar
                </button>
              </div>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-700">Abertas</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{totals.open}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Calculadas
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {totals.calculated}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Aprovadas
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {totals.approved}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Líquido gerencial fechado
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatMoney(totals.net)}
              </p>
              <p className="text-xs text-slate-500">
                {totals.closed} competência(s)
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === item.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {loading ? (
                <DataState variant="loading" />
              ) : tab === "competencies" ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Todas as situações</option>
                      {Object.entries(STATUS_LABELS).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {competencies.length === 0 ? (
                    <DataState
                      variant="empty"
                      description="Nenhuma competência aberta neste CNPJ. Abra o mês para configurar remunerações e lançar eventos."
                      compact
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Competência</th>
                            <th className="px-3 py-2">Período</th>
                            <th className="px-3 py-2 text-right">Pessoas</th>
                            <th className="px-3 py-2 text-right">Bruto gerencial</th>
                            <th className="px-3 py-2 text-right">Descontos</th>
                            <th className="px-3 py-2 text-right">Líquido gerencial</th>
                            <th className="px-3 py-2">Situação</th>
                            <th className="px-3 py-2">Financeiro</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {competencies.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-3 font-semibold text-slate-900">
                                {item.label}
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600">
                                {formatDate(item.period_start)} a{" "}
                                {formatDate(item.period_end)}
                              </td>
                              <td className="px-3 py-3 text-right text-slate-700">
                                {item.employee_count}
                              </td>
                              <td className="px-3 py-3 text-right text-slate-700">
                                {formatMoney(item.gross_total)}
                              </td>
                              <td className="px-3 py-3 text-right text-rose-700">
                                {formatMoney(item.deductions_total)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-slate-900">
                                {formatMoney(item.net_total)}
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge
                                  label={
                                    STATUS_LABELS[item.status]?.label || item.status
                                  }
                                  tone={
                                    STATUS_LABELS[item.status]?.tone || "slate"
                                  }
                                />
                              </td>
                              <td className="px-3 py-3 text-xs">
                                {item.payment_account_id ? (
                                  <span className="text-emerald-700">
                                    Título #{item.payment_account_id}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    Não integrado
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => void openCompetency(item)}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Abrir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : tab === "compensations" ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    A remuneração é contratual, versionada por vigência e obrigatória
                    para todos os vínculos elegíveis antes do cálculo. Transferências
                    entre vínculos não são rateadas automaticamente.
                  </p>
                  {compensations.length === 0 ? (
                    <DataState
                      variant="empty"
                      description="Nenhum vínculo empregatício cadastrado neste CNPJ."
                      compact
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Colaborador</th>
                            <th className="px-3 py-2">Vínculo</th>
                            <th className="px-3 py-2">Empregador</th>
                            <th className="px-3 py-2 text-right">Salário base</th>
                            <th className="px-3 py-2">Vigência</th>
                            <th className="px-3 py-2">Fonte</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {compensations.map((row) => (
                            <tr key={row.employment_link_id}>
                              <td className="px-3 py-3">
                                <p className="font-medium text-slate-900">
                                  {row.contributor_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {row.position_title || "Sem cargo"} ·{" "}
                                  {row.department || "Sem setor"}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600">
                                #{row.employment_link_id} · {row.link_status}
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600">
                                {row.trade_name || row.legal_name}
                                <span className="block">{row.cnpj}</span>
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-slate-900">
                                {row.base_salary === null ||
                                row.base_salary === undefined
                                  ? "Não configurado"
                                  : formatMoney(row.base_salary)}
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600">
                                {formatDate(row.effective_from)}
                              </td>
                              <td className="max-w-52 px-3 py-3 text-xs text-slate-600">
                                {row.source_note || "—"}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {canProcess && (
                                  <button
                                    type="button"
                                    onClick={() => openCompensation(row)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                    Configurar
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Rubricas são versionadas por vigência. A fonte é obrigatória e
                    nenhuma alíquota legal é incluída por padrão.
                  </p>
                  {rubrics.length === 0 ? (
                    <DataState
                      variant="empty"
                      description="Nenhuma rubrica cadastrada. Cadastre apenas rubricas com fonte normativa ou regra interna validada."
                      compact
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Código / nome</th>
                            <th className="px-3 py-2">Tipo</th>
                            <th className="px-3 py-2">Cálculo vigente</th>
                            <th className="px-3 py-2">Vigência</th>
                            <th className="px-3 py-2">Fonte</th>
                            <th className="px-3 py-2 text-right">Versões</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rubrics.map((rubric) => (
                            <tr key={rubric.id}>
                              <td className="px-3 py-3">
                                <p className="font-semibold text-slate-900">
                                  {rubric.code}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {rubric.name}
                                </p>
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge
                                  label={KIND_LABELS[rubric.kind]}
                                  tone={rubric.kind === "earning" ? "green" : "red"}
                                />
                              </td>
                              <td className="px-3 py-3 text-slate-700">
                                {rubric.calculation_type === "percentage"
                                  ? `${rubric.rate ?? 0}%`
                                  : formatMoney(rubric.fixed_amount)}
                              </td>
                              <td className="px-3 py-3 text-xs text-slate-600">
                                {formatDate(rubric.effective_from)}
                                {rubric.effective_to
                                  ? ` a ${formatDate(rubric.effective_to)}`
                                  : " em diante"}
                              </td>
                              <td className="max-w-64 px-3 py-3 text-xs text-slate-600">
                                <p className="truncate" title={rubric.source_note || ""}>
                                  {rubric.source_note || "—"}
                                </p>
                              </td>
                              <td className="px-3 py-3 text-right text-slate-700">
                                {rubric.version_count}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void openRubricDetail(rubric)}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Histórico
                                  </button>
                                  {canProcess && (
                                    <button
                                      type="button"
                                      onClick={() => openVersionModal(rubric)}
                                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      Nova vigência
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
            A integração financeira da folha cria um único título pendente com o
            líquido gerencial. Ela não calcula encargos, não gera holerite e não
            transmite eSocial. A aprovação e o fechamento exigem permissões próprias.
          </div>
        </div>
      </div>

      <Modal
        open={competencyModalOpen}
        onClose={() => setCompetencyModalOpen(false)}
        title="Abrir competência"
        description="A competência representa um mês fechado para cálculo gerencial neste CNPJ."
        footer={
          <>
            <button
              type="button"
              onClick={() => setCompetencyModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payroll-competency-form"
              disabled={savingCompetency}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingCompetency ? "Abrindo..." : "Abrir competência"}
            </button>
          </>
        }
      >
        <form
          id="payroll-competency-form"
          onSubmit={createCompetency}
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Mês</span>
            <input
              type="month"
              required
              value={competencyMonth}
              onChange={(event) => setCompetencyMonth(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <Alert tone="blue">
            Abrir a competência não calcula nem cria valores. Configure a remuneração
            de todos os vínculos antes de calcular.
          </Alert>
        </form>
      </Modal>

      <Modal
        open={rubricModalOpen}
        onClose={() => setRubricModalOpen(false)}
        wide
        title="Nova rubrica versionada"
        description="A fonte e a vigência são obrigatórias. Não há alíquota legal embutida."
        footer={
          <>
            <button
              type="button"
              onClick={() => setRubricModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payroll-rubric-form"
              disabled={savingRubric}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingRubric ? "Salvando..." : "Criar rubrica"}
            </button>
          </>
        }
      >
        <form
          id="payroll-rubric-form"
          onSubmit={submitRubric}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Código</span>
            <input
              required
              value={rubricForm.code}
              onChange={(event) =>
                setRubricForm({ ...rubricForm, code: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="ADIANTAMENTO"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nome</span>
            <input
              required
              value={rubricForm.name}
              onChange={(event) =>
                setRubricForm({ ...rubricForm, name: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tipo</span>
            <select
              value={rubricForm.kind}
              onChange={(event) =>
                setRubricForm({
                  ...rubricForm,
                  kind: event.target.value as PayrollRubricKind,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="earning">Provento</option>
              <option value="deduction">Desconto</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Forma de cálculo
            </span>
            <select
              value={rubricForm.calculationType}
              onChange={(event) =>
                setRubricForm({
                  ...rubricForm,
                  calculationType: event.target.value as PayrollCalculationType,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="fixed">Valor fixo por unidade</option>
              <option value="percentage">Percentual sobre a referência</option>
            </select>
          </label>
          {rubricForm.calculationType === "fixed" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Valor fixo
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={rubricForm.fixedAmount}
                onChange={(event) =>
                  setRubricForm({
                    ...rubricForm,
                    fixedAmount: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Percentual (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.0001"
                required
                value={rubricForm.rate}
                onChange={(event) =>
                  setRubricForm({ ...rubricForm, rate: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Vigência inicial
            </span>
            <input
              type="date"
              required
              value={rubricForm.effectiveFrom}
              onChange={(event) =>
                setRubricForm({
                  ...rubricForm,
                  effectiveFrom: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Vigência final (opcional)
            </span>
            <input
              type="date"
              value={rubricForm.effectiveTo}
              onChange={(event) =>
                setRubricForm({
                  ...rubricForm,
                  effectiveTo: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Fonte / fundamento (mínimo 10 caracteres)
            </span>
            <textarea
              required
              minLength={10}
              rows={2}
              value={rubricForm.sourceNote}
              onChange={(event) =>
                setRubricForm({ ...rubricForm, sourceNote: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Norma, contrato, acordo coletivo ou regra interna validada, com referência"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Link da fonte (opcional)
            </span>
            <input
              type="url"
              value={rubricForm.sourceUrl}
              onChange={(event) =>
                setRubricForm({ ...rubricForm, sourceUrl: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="https://..."
            />
          </label>
          <div className="sm:col-span-2">
            <Alert tone="amber">
              Não são aceitas rubricas sem fonte. O sistema não preenche percentuais
              legais automaticamente.
            </Alert>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(versionModalRubric)}
        onClose={() => setVersionModalRubric(null)}
        title={`Nova vigência — ${versionModalRubric?.code || ""}`}
        description="A versão anterior permanece no histórico; cálculos usam a versão vigente no fim da competência."
        footer={
          <>
            <button
              type="button"
              onClick={() => setVersionModalRubric(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payroll-version-form"
              disabled={savingVersion}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingVersion ? "Salvando..." : "Salvar vigência"}
            </button>
          </>
        }
      >
        <form
          id="payroll-version-form"
          onSubmit={submitVersion}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Forma de cálculo
            </span>
            <select
              value={versionForm.calculationType}
              onChange={(event) =>
                setVersionForm({
                  ...versionForm,
                  calculationType: event.target.value as PayrollCalculationType,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="fixed">Valor fixo</option>
              <option value="percentage">Percentual</option>
            </select>
          </label>
          {versionForm.calculationType === "fixed" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={versionForm.fixedAmount}
                onChange={(event) =>
                  setVersionForm({
                    ...versionForm,
                    fixedAmount: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Percentual</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.0001"
                required
                value={versionForm.rate}
                onChange={(event) =>
                  setVersionForm({ ...versionForm, rate: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Início</span>
            <input
              type="date"
              required
              value={versionForm.effectiveFrom}
              onChange={(event) =>
                setVersionForm({
                  ...versionForm,
                  effectiveFrom: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Fim (opcional)
            </span>
            <input
              type="date"
              value={versionForm.effectiveTo}
              onChange={(event) =>
                setVersionForm({
                  ...versionForm,
                  effectiveTo: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Fonte / fundamento da nova vigência
            </span>
            <textarea
              required
              minLength={10}
              rows={2}
              value={versionForm.sourceNote}
              onChange={(event) =>
                setVersionForm({
                  ...versionForm,
                  sourceNote: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Link da fonte (opcional)
            </span>
            <input
              type="url"
              value={versionForm.sourceUrl}
              onChange={(event) =>
                setVersionForm({
                  ...versionForm,
                  sourceUrl: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(rubricDetail)}
        onClose={() => setRubricDetail(null)}
        wide
        title={`Histórico de versões — ${rubricDetail?.code || ""}`}
        footer={
          <button
            type="button"
            onClick={() => setRubricDetail(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        }
      >
        {rubricDetailLoading ? (
          <DataState variant="loading" compact />
        ) : rubricDetail ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{rubricDetail.name}</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Versão</th>
                    <th className="px-3 py-2">Cálculo</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Vigência</th>
                    <th className="px-3 py-2">Fonte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(rubricDetail.versions || []).map((version) => (
                    <tr key={version.id}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        v{version.version}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {version.calculation_type === "percentage"
                          ? "Percentual"
                          : "Fixo"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {version.calculation_type === "percentage"
                          ? `${version.rate}%`
                          : formatMoney(version.fixed_amount)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatDate(version.effective_from)} a{" "}
                        {version.effective_to
                          ? formatDate(version.effective_to)
                          : "em diante"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {version.source_note}
                        {version.source_url && (
                          <a
                            href={version.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 text-blue-700 underline"
                          >
                            fonte
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <DataState variant="empty" compact />
        )}
      </Modal>

      <Modal
        open={Boolean(compensationRow)}
        onClose={() => setCompensationRow(null)}
        title="Configurar remuneração"
        description={
          compensationRow
            ? `${compensationRow.contributor_name} · vínculo #${compensationRow.employment_link_id}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setCompensationRow(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payroll-compensation-form"
              disabled={savingCompensation}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingCompensation ? "Salvando..." : "Salvar remuneração"}
            </button>
          </>
        }
      >
        <form
          id="payroll-compensation-form"
          onSubmit={saveCompensation}
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Salário base</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={compensationBase}
              onChange={(event) => setCompensationBase(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Vigência</span>
            <input
              type="date"
              required
              value={compensationEffectiveFrom}
              onChange={(event) =>
                setCompensationEffectiveFrom(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Fonte / origem (mínimo 5 caracteres)
            </span>
            <textarea
              required
              minLength={5}
              rows={2}
              value={compensationSource}
              onChange={(event) => setCompensationSource(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Contrato de trabalho registrado, aditivo, acordo..."
            />
          </label>
          <Alert tone="blue">
            O valor é contratual e não inclui benefícios ou encargos automaticamente.
          </Alert>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        wide
        title={detail ? `Folha ${detail.label}` : "Competência"}
        description={
          detail
            ? `Período ${formatDate(detail.period_start)} a ${formatDate(
                detail.period_end
              )} · ${STATUS_LABELS[detail.status]?.label || detail.status}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
            {detail && detail.status === "open" && canProcess && (
              <>
                <button
                  type="button"
                  onClick={openEventModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Evento
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void calculate(detail)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Calculator className="h-4 w-4" />
                  Calcular
                </button>
              </>
            )}
            {detail && detail.status === "calculated" && (
              <>
                {canProcess && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void reopen(detail)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reabrir
                  </button>
                )}
                {canApprove && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void approve(detail)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovar
                  </button>
                )}
              </>
            )}
            {detail && detail.status === "approved" && canApprove && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void close(detail)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Fechar competência
              </button>
            )}
            {detail &&
              detail.status === "closed" &&
              canApprove &&
              !detail.payment_account_id && (
                <button
                  type="button"
                  disabled={actionLoading || !canFinance}
                  title={
                    !canFinance
                      ? "Requer permissão financeira para criar títulos."
                      : undefined
                  }
                  onClick={() => void postFinance(detail)}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  <Wallet className="h-4 w-4" />
                  Integrar ao financeiro
                </button>
              )}
          </>
        }
      >
        {detailLoading ? (
          <DataState variant="loading" compact />
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Bruto gerencial</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatMoney(detail.gross_total)}
                </p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs uppercase text-rose-700">Descontos lançados</p>
                <p className="mt-1 text-xl font-bold text-rose-900">
                  {formatMoney(detail.deductions_total)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs uppercase text-emerald-700">
                  Líquido gerencial
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-900">
                  {formatMoney(detail.net_total)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">Pessoas</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {detail.employee_count}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="flex items-center gap-1 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Memória de cálculo gerencial
              </p>
              <p className="mt-1">
                Não há cálculo automático de INSS, IRRF, FGTS ou provisões. Só entram
                salário base e eventos com rubricas versionadas. A folha legal e o
                eSocial seguem fora do escopo desta versão.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Cálculo</p>
                <p>{formatDateTime(detail.calculated_at)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Aprovação</p>
                <p>{formatDateTime(detail.approved_at)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Fechamento</p>
                <p>{formatDateTime(detail.closed_at)}</p>
              </div>
            </div>

            {detail.payment_account_id && (
              <Alert tone="green">
                Integrada ao contas a pagar pelo título #{detail.payment_account_id}.
                Esta integração é gerencial e não representa guia fiscal.
              </Alert>
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <Sparkles className="h-4 w-4" /> Eventos da competência
              </h3>
              {(detail.events || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum evento lançado. O cálculo usará somente o salário base.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Rubrica</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Vínculo</th>
                        <th className="px-3 py-2 text-right">Quantidade</th>
                        <th className="px-3 py-2 text-right">Referência</th>
                        <th className="px-3 py-2">Observação</th>
                        {detail.status === "open" && canProcess && (
                          <th className="px-3 py-2" />
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(detail.events || []).map((event) => (
                        <tr key={event.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900">
                              {event.rubric_code}
                            </p>
                            <p className="text-xs text-slate-500">
                              {event.rubric_name}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              label={KIND_LABELS[event.rubric_kind]}
                              tone={
                                event.rubric_kind === "earning" ? "green" : "red"
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {event.employment_link_id
                              ? `#${event.employment_link_id}`
                              : "Todos os vínculos"}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {event.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {event.reference_amount === null ||
                            event.reference_amount === undefined
                              ? "Salário base"
                              : formatMoney(event.reference_amount)}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {event.notes || "—"}
                          </td>
                          {detail.status === "open" && canProcess && (
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() =>
                                  void removeEvent(
                                    detail.id,
                                    event.id,
                                    event.rubric_code
                                  )
                                }
                                className="rounded border border-rose-300 p-1 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                title="Remover evento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <BadgeDollarSign className="h-4 w-4" /> Memória por vínculo
              </h3>
              {(detail.entries || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum cálculo armazenado. Calcule a competência para gerar a
                  memória com retrato dos dados.
                </p>
              ) : (
                <div className="space-y-2">
                  {(detail.entries || []).map((entry) => (
                    <details
                      key={entry.id}
                      className="rounded-lg border border-slate-200 bg-white"
                    >
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-900">
                          {entry.contributor_name}
                          <span className="ml-2 text-xs font-normal text-slate-500">
                            {entry.position_title || "Sem cargo"} · vínculo #
                            {entry.employment_link_id}
                          </span>
                        </span>
                        <span className="flex items-center gap-3 text-xs text-slate-600">
                          <span>Bruto {formatMoney(entry.gross_amount)}</span>
                          <span className="text-rose-700">
                            Descontos {formatMoney(entry.deductions_amount)}
                          </span>
                          <strong className="text-slate-900">
                            Líquido {formatMoney(entry.net_amount)}
                          </strong>
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </summary>
                      {entry.snapshot?.statutory && <div className="p-3 text-sm bg-blue-50">
                        <p>Modelo {entry.snapshot.statutory.model} · pagamento {entry.snapshot.statutory.paymentDate}</p>
                        <p>Base IRRF {formatMoney(entry.snapshot.statutory.irrfBase)} · FGTS do empregador {formatMoney(entry.snapshot.statutory.fgtsEmployer)} (não descontado do empregado).</p>
                        <p className="text-xs">{entry.snapshot.statutory.scope}</p>
                      </div>}
                      <div className="overflow-x-auto border-t border-slate-100">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-3 py-2">Rubrica</th>
                              <th className="px-3 py-2">Tipo</th>
                              <th className="px-3 py-2 text-right">Qtde</th>
                              <th className="px-3 py-2 text-right">Referência</th>
                              <th className="px-3 py-2 text-right">Valor</th>
                              <th className="px-3 py-2">Fonte</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {entry.items.map((line) => (
                              <tr key={line.id}>
                                <td className="px-3 py-2">
                                  <p className="font-medium text-slate-800">
                                    {line.name}
                                  </p>
                                  <p className="text-slate-400">{line.source}</p>
                                </td>
                                <td className="px-3 py-2">
                                  {KIND_LABELS[line.kind]}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {line.quantity}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {line.reference_amount === null
                                    ? "—"
                                    : formatMoney(line.reference_amount)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                                  {formatMoney(line.amount)}
                                </td>
                                <td className="max-w-64 px-3 py-2 text-slate-500">
                                  {line.source_note || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Empregador: {entry.legal_name} · {entry.cnpj} · salário base{" "}
                          {formatMoney(entry.base_salary)}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <DataState variant="empty" compact />
        )}
      </Modal>

      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Novo evento da folha"
        description="Evento sem vínculo é aplicado a todos os vínculos elegíveis da competência."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEventModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="payroll-event-form"
              disabled={savingEvent}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingEvent ? "Lançando..." : "Lançar evento"}
            </button>
          </>
        }
      >
        <form
          id="payroll-event-form"
          onSubmit={submitEvent}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Rubrica</span>
            <select
              required
              value={eventForm.rubricId}
              onChange={(event) =>
                setEventForm({ ...eventForm, rubricId: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Selecione...</option>
              {rubrics
                .filter((rubric) => rubric.active)
                .map((rubric) => (
                  <option key={rubric.id} value={rubric.id}>
                    {rubric.code} · {rubric.name} ·{" "}
                    {rubric.calculation_type === "percentage"
                      ? `${rubric.rate}%`
                      : formatMoney(rubric.fixed_amount)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Vínculo</span>
            <select
              value={eventForm.employmentLinkId}
              onChange={(event) =>
                setEventForm({
                  ...eventForm,
                  employmentLinkId: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Todos os vínculos elegíveis</option>
              {compensatedLinks.map((row) => (
                <option key={row.employment_link_id} value={row.employment_link_id}>
                  {row.contributor_name} · #{row.employment_link_id}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Quantidade</span>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              required
              value={eventForm.quantity}
              onChange={(event) =>
                setEventForm({ ...eventForm, quantity: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Valor de referência
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={eventForm.referenceAmount}
              onChange={(event) =>
                setEventForm({
                  ...eventForm,
                  referenceAmount: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Em branco: salário base"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Observação
            </span>
            <textarea
              rows={2}
              value={eventForm.notes}
              onChange={(event) =>
                setEventForm({ ...eventForm, notes: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2">
            <Alert tone="blue">
              Eventos só podem ser lançados com a competência aberta. Após calcular,
              reabra para editar; após aprovar, não há reabertura.
            </Alert>
          </div>
        </form>
      </Modal>
    </Dashboard>
  );
}
