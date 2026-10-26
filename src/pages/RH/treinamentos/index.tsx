import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  FolderPlus,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  UserPlus,
  UserX,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";

import Dashboard from "../../../components/dashboard/Dashboard";
import { useAuth } from "../../../AuthContext";
import { DataState } from "../../../components/ui/DataState";
import { Modal } from "../../../components/ui/Modal";
import {
  Alert,
  StatusBadge,
  formatDateTime,
} from "../../../components/ui/StatusBadge";
import {
  Training,
  TrainingCategory,
  TrainingEnrollment,
  TrainingInput,
  TrainingModality,
  TrainingSession,
  TrainingStatus,
  TrainingSummary,
  cancelTraining,
  cancelTrainingEnrollment,
  completeTrainingEnrollment,
  createTraining,
  createTrainingCategory,
  createTrainingSession,
  enrollTraining,
  getTraining,
  getTrainingSummary,
  issueTrainingCertificate,
  getTrainingCertificate,
  downloadTrainingCertificate,
  listTrainings,
  listTrainingCategories,
  setTrainingAttendance,
  updateTraining,
  updateTrainingSession,
} from "../../../services/trainingService";
import {
  EmploymentContributor,
  listEmploymentContributors,
} from "../../../services/employmentService";

const STATUS_LABELS: Record<
  TrainingStatus,
  { label: string; tone: "slate" | "blue" | "amber" | "green" | "red" }
> = {
  draft: { label: "Rascunho", tone: "slate" },
  published: { label: "Publicado", tone: "blue" },
  in_progress: { label: "Em andamento", tone: "amber" },
  completed: { label: "Concluído", tone: "green" },
  cancelled: { label: "Cancelado", tone: "red" },
};

const ENROLLMENT_LABELS: Record<
  TrainingEnrollment["status"],
  { label: string; tone: "slate" | "blue" | "amber" | "green" | "red" }
> = {
  enrolled: { label: "Inscrito", tone: "blue" },
  attended: { label: "Presente", tone: "amber" },
  absent: { label: "Ausente", tone: "red" },
  completed: { label: "Concluído", tone: "green" },
  cancelled: { label: "Cancelado", tone: "slate" },
};

const MODALITY_LABELS: Record<TrainingModality, string> = {
  presencial: "Presencial",
  online: "On-line",
  hibrido: "Híbrido",
};

interface TrainingFormState {
  title: string;
  categoryId: string;
  description: string;
  instructorName: string;
  modality: TrainingModality;
  workloadHours: string;
  status: TrainingStatus;
}

const EMPTY_TRAINING: TrainingFormState = {
  title: "",
  categoryId: "",
  description: "",
  instructorName: "",
  modality: "presencial",
  workloadHours: "8",
  status: "draft",
};

interface SessionFormState {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: string;
}

const EMPTY_SESSION: SessionFormState = {
  title: "",
  startsAt: "",
  endsAt: "",
  location: "",
  capacity: "",
};

function localNow(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TrainingPage() {
  const { activeLegalEntity, hasPermission } = useAuth();
  const canView = hasPermission("rh", "view");
  const canManage = hasPermission("rh", "manage_training");

  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [summary, setSummary] = useState<TrainingSummary | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [detail, setDetail] = useState<Training | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [contributors, setContributors] = useState<EmploymentContributor[]>([]);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [trainingForm, setTrainingForm] =
    useState<TrainingFormState>(EMPTY_TRAINING);
  const [savingTraining, setSavingTraining] = useState(false);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(EMPTY_SESSION);
  const [savingSession, setSavingSession] = useState(false);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollSessionId, setEnrollSessionId] = useState("");
  const [enrollLinkId, setEnrollLinkId] = useState("");
  const [enrollNotes, setEnrollNotes] = useState("");
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const legalEntityId = activeLegalEntity?.id;

  const load = useCallback(async () => {
    if (!legalEntityId) {
      setTrainings([]);
      setCategories([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [listResponse, summaryResponse, categoriesResponse] = await Promise.all([
      listTrainings({
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        search: search.trim() || undefined,
      }),
      getTrainingSummary(),
      listTrainingCategories(),
    ]);
    if (!listResponse.ok || !listResponse.data) {
      setError(
        listResponse.error || "Não foi possível carregar os treinamentos."
      );
      setTrainings([]);
    } else {
      setTrainings(listResponse.data);
    }
    setSummary(summaryResponse.ok ? summaryResponse.data : null);
    setCategories(categoriesResponse.ok ? categoriesResponse.data || [] : []);
    setLoading(false);
  }, [categoryFilter, legalEntityId, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadContributors = useCallback(async () => {
    if (!legalEntityId) return;
    const response = await listEmploymentContributors();
    if (response.ok && response.data) {
      setContributors(
        response.data.filter(
          (item) => item.employment_link_id && item.legal_entity_id === legalEntityId
        )
      );
    } else {
      setContributors([]);
    }
  }, [legalEntityId]);

  useEffect(() => {
    void loadContributors();
  }, [loadContributors]);

  const openDetail = async (item: Training) => {
    setDetail(item);
    setDetailLoading(true);
    setError(null);
    const response = await getTraining(item.id);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível carregar o treinamento.");
    } else {
      setDetail(response.data);
    }
    setDetailLoading(false);
  };

  const refreshDetail = async (id: number) => {
    const response = await getTraining(id);
    if (response.ok && response.data) setDetail(response.data);
    await load();
  };

  const openNewTraining = () => {
    setEditingTraining(null);
    setTrainingForm(EMPTY_TRAINING);
    setTrainingModalOpen(true);
    setError(null);
  };

  const openEditTraining = (item: Training) => {
    setEditingTraining(item);
    setTrainingForm({
      title: item.title,
      categoryId: item.category_id ? String(item.category_id) : "",
      description: item.description || "",
      instructorName: item.instructor_name || "",
      modality: item.modality,
      workloadHours: String(item.workload_hours),
      status: item.status,
    });
    setTrainingModalOpen(true);
    setError(null);
  };

  const submitTraining = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingTraining(true);
    setError(null);
    const payload: TrainingInput = {
      title: trainingForm.title.trim(),
      categoryId: trainingForm.categoryId || null,
      description: trainingForm.description.trim() || undefined,
      instructorName: trainingForm.instructorName.trim() || undefined,
      modality: trainingForm.modality,
      workloadHours: Number(trainingForm.workloadHours),
      status: trainingForm.status,
    };
    const response = editingTraining
      ? await updateTraining(editingTraining.id, payload)
      : await createTraining(payload);
    setSavingTraining(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível salvar o treinamento.");
      return;
    }
    setTrainingModalOpen(false);
    setSuccess(
      editingTraining ? "Treinamento atualizado." : "Treinamento criado e auditado."
    );
    if (editingTraining) setDetail(response.data);
    await load();
  };

  const submitCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCategory(true);
    setError(null);
    const response = await createTrainingCategory({
      name: categoryName.trim(),
      description: categoryDescription.trim() || undefined,
    });
    setSavingCategory(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível criar a categoria.");
      return;
    }
    setCategoryModalOpen(false);
    setCategoryName("");
    setCategoryDescription("");
    setSuccess("Categoria de treinamento criada.");
    await load();
  };

  const openSessionModal = () => {
    setSessionForm({ ...EMPTY_SESSION, startsAt: localNow() });
    setSessionModalOpen(true);
    setError(null);
  };

  const submitSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    if (new Date(sessionForm.endsAt) <= new Date(sessionForm.startsAt)) {
      setError("O término da turma deve ser posterior ao início.");
      return;
    }
    setSavingSession(true);
    setError(null);
    const response = await createTrainingSession(detail.id, {
      title: sessionForm.title.trim() || undefined,
      startsAt: new Date(sessionForm.startsAt).toISOString(),
      endsAt: new Date(sessionForm.endsAt).toISOString(),
      location: sessionForm.location.trim() || undefined,
      capacity: sessionForm.capacity ? Number(sessionForm.capacity) : null,
    });
    setSavingSession(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível criar a turma.");
      return;
    }
    setSessionModalOpen(false);
    setSuccess("Turma criada para o treinamento.");
    await refreshDetail(detail.id);
  };

  const openEnrollModal = (session?: TrainingSession) => {
    setEnrollSessionId(
      session ? String(session.id) : detail?.sessions?.[0]
        ? String(detail.sessions[0].id)
        : ""
    );
    setEnrollLinkId("");
    setEnrollNotes("");
    setEnrollModalOpen(true);
    setError(null);
  };

  const submitEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingEnrollment(true);
    setError(null);
    const response = await enrollTraining(
      enrollSessionId,
      enrollLinkId,
      enrollNotes.trim() || undefined
    );
    setSavingEnrollment(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível inscrever o participante.");
      return;
    }
    setEnrollModalOpen(false);
    setSuccess("Participante inscrito com vínculo empregatício preservado.");
    if (detail) await refreshDetail(detail.id);
  };

  const attendance = async (
    enrollment: TrainingEnrollment,
    status: "attended" | "absent"
  ) => {
    if (!detail) return;
    setActionLoading(true);
    setError(null);
    const response = await setTrainingAttendance(enrollment.id, status);
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível registrar a presença.");
      return;
    }
    setSuccess(
      status === "attended"
        ? "Presença registrada."
        : "Ausência registrada."
    );
    await refreshDetail(detail.id);
  };

  const completeEnrollment = async (enrollment: TrainingEnrollment) => {
    if (!detail) return;
    const prompt = await Swal.fire({
      icon: "question",
      title: "Concluir participação",
      text: "A conclusão exige presença registrada e preserva data, responsável e histórico.",
      input: "number",
      inputLabel: "Nota final (opcional, 0 a 100)",
      inputAttributes: { min: "0", max: "100", step: "0.01" },
      showCancelButton: true,
      confirmButtonText: "Concluir",
      cancelButtonText: "Voltar",
    });
    if (!prompt.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await completeTrainingEnrollment(
      enrollment.id,
      prompt.value ? prompt.value : null
    );
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível concluir a participação.");
      return;
    }
    setSuccess("Participação concluída. O certificado pode ser emitido.");
    await refreshDetail(detail.id);
  };

  const cancelEnrollment = async (enrollment: TrainingEnrollment) => {
    if (!detail) return;
    const prompt = await Swal.fire({
      icon: "warning",
      title: "Cancelar inscrição?",
      input: "textarea",
      inputLabel: "Motivo",
      showCancelButton: true,
      confirmButtonText: "Cancelar inscrição",
      cancelButtonText: "Voltar",
      inputValidator: (value) =>
        !value || value.trim().length < 3 ? "Informe o motivo." : null,
    });
    if (!prompt.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await cancelTrainingEnrollment(
      enrollment.id,
      prompt.value.trim()
    );
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível cancelar a inscrição.");
      return;
    }
    setSuccess("Inscrição cancelada com motivo registrado.");
    await refreshDetail(detail.id);
  };

  const certificate = async (enrollment: TrainingEnrollment) => {
    if (!detail) return;
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Emitir certificado?",
      text: "O certificado usa um retrato dos dados no momento da emissão e não pode ser reemitido com outro conteúdo.",
      showCancelButton: true,
      confirmButtonText: "Emitir",
      cancelButtonText: "Voltar",
    });
    if (!confirmed.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await issueTrainingCertificate(enrollment.id);
    setActionLoading(false);
    if (!response.ok || !response.data) {
      setError(response.error || "Não foi possível emitir o certificado.");
      return;
    }
    await Swal.fire({
      icon: "success",
      title: response.data.replayed ? "Certificado já emitido" : "Certificado emitido",
      html: `<p style="font-size:14px">Código verificável:</p><p style="font-size:20px;font-weight:bold;letter-spacing:1px">${response.data.code}</p><p style="font-size:12px;color:#64748b">Emitido em ${formatDateTime(
        response.data.issued_at
      )}</p>`,
      confirmButtonText: "Fechar",
    });
    await refreshDetail(detail.id);
  };

  const downloadCertificate = async (enrollment: TrainingEnrollment) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await getTrainingCertificate(enrollment.id);
      if (!response.ok || !response.data) throw new Error(response.error || 'Não foi possível carregar o certificado.');
      await downloadTrainingCertificate(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível baixar o certificado.');
    } finally { setActionLoading(false); }
  };

  const cancelTrainingAction = async (item: Training) => {
    const prompt = await Swal.fire({
      icon: "warning",
      title: "Cancelar treinamento?",
      text: "As inscrições existentes permanecem no histórico; novas inscrições ficam bloqueadas.",
      input: "textarea",
      inputLabel: "Motivo",
      showCancelButton: true,
      confirmButtonText: "Cancelar treinamento",
      cancelButtonText: "Voltar",
      inputValidator: (value) =>
        !value || value.trim().length < 5 ? "Informe o motivo." : null,
    });
    if (!prompt.isConfirmed) return;
    setActionLoading(true);
    setError(null);
    const response = await cancelTraining(item.id, prompt.value.trim());
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível cancelar o treinamento.");
      return;
    }
    setSuccess("Treinamento cancelado com histórico preservado.");
    await refreshDetail(item.id);
  };

  const updateSessionStatus = async (
    session: TrainingSession,
    status: TrainingSession["status"]
  ) => {
    if (!detail) return;
    setActionLoading(true);
    setError(null);
    const response = await updateTrainingSession(session.id, { status });
    setActionLoading(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível alterar a situação da turma.");
      return;
    }
    setSuccess("Situação da turma atualizada.");
    await refreshDetail(detail.id);
  };

  const filteredContributors = useMemo(
    () =>
      contributors.filter(
        (item) =>
          item.employment_link_id &&
          item.active !== false &&
          (!activeLegalEntity || item.legal_entity_id === activeLegalEntity.id)
      ),
    [activeLegalEntity, contributors]
  );

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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Categoria
                  </button>
                  <button
                    type="button"
                    onClick={openNewTraining}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Novo treinamento
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Treinamentos</h1>
                <p className="text-sm text-gray-600">
                  Cursos, turmas, presença, conclusão e certificados com histórico
                  auditado. A inscrição sempre usa o vínculo empregatício e o CNPJ
                  empregador.
                </p>
              </div>
            </div>
          </div>

          {!activeLegalEntity && (
            <Alert tone="amber">
              Selecione um CNPJ no cabeçalho para inscrever participantes e operar
              turmas. Os cursos são organizacionais, mas a inscrição é vinculada ao
              empregador.
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
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Treinamentos
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary?.trainings ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                {summary?.published ?? 0} publicado(s)
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Em andamento
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {summary?.inProgress ?? "—"}
              </p>
              <p className="text-xs text-amber-700">
                {summary?.upcomingSessions ?? 0} turma(s) futura(s)
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Participações concluídas
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {summary?.completedEnrollments ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-xs uppercase tracking-wide text-violet-700">
                Certificados
              </p>
              <p className="mt-1 text-2xl font-bold text-violet-900">
                {summary?.certificates ?? "—"}
              </p>
              <p className="text-xs text-violet-700">Códigos verificáveis</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Título, instrutor ou descrição"
              className="min-w-60 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-md"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white">
              <DataState variant="loading" />
            </div>
          ) : trainings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white">
              <DataState
                variant="empty"
                description="Nenhum treinamento encontrado. Crie o primeiro curso e suas turmas."
              />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {trainings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={STATUS_LABELS[item.status]?.label || item.status}
                          tone={STATUS_LABELS[item.status]?.tone || "slate"}
                        />
                        <span className="text-xs text-slate-500">
                          {item.category_name || "Sem categoria"}
                        </span>
                      </div>
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {MODALITY_LABELS[item.modality]} · {item.workload_hours}h
                        {item.instructor_name
                          ? ` · Instrutor: ${item.instructor_name}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                  </div>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-semibold text-slate-900">
                        {item.session_count}
                      </p>
                      <p className="text-slate-500">turma(s)</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-semibold text-slate-900">
                        {item.enrollment_count}
                      </p>
                      <p className="text-slate-500">inscrição(ões)</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-semibold text-slate-900">
                        {item.completed_count}
                      </p>
                      <p className="text-slate-500">concluída(s)</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {item.next_session_at
                        ? `Próxima turma: ${formatDateTime(item.next_session_at)}`
                        : "Sem turma futura"}
                    </span>
                    <button
                      type="button"
                      onClick={() => void openDetail(item)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            Participantes só podem ser inscritos com vínculo ativo e acesso ao CNPJ
            empregador. Conclusão e certificado preservam o retrato dos dados e são
            auditados; nenhum certificado é emitido automaticamente.
          </div>
        </div>
      </div>

      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Nova categoria"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="training-category-form"
              disabled={savingCategory}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingCategory ? "Salvando..." : "Criar categoria"}
            </button>
          </>
        }
      >
        <form
          id="training-category-form"
          onSubmit={submitCategory}
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Nome</span>
            <input
              required
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Descrição</span>
            <textarea
              rows={3}
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
        wide
        title={editingTraining ? "Editar treinamento" : "Novo treinamento"}
        description="O curso é organizacional e não movimenta estoque nem financeiro."
        footer={
          <>
            <button
              type="button"
              onClick={() => setTrainingModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="training-form"
              disabled={savingTraining}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingTraining ? "Salvando..." : "Salvar treinamento"}
            </button>
          </>
        }
      >
        <form
          id="training-form"
          onSubmit={submitTraining}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Título</span>
            <input
              required
              value={trainingForm.title}
              onChange={(event) =>
                setTrainingForm({ ...trainingForm, title: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Categoria</span>
            <select
              value={trainingForm.categoryId}
              onChange={(event) =>
                setTrainingForm({ ...trainingForm, categoryId: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Instrutor</span>
            <input
              value={trainingForm.instructorName}
              onChange={(event) =>
                setTrainingForm({
                  ...trainingForm,
                  instructorName: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Modalidade</span>
            <select
              value={trainingForm.modality}
              onChange={(event) =>
                setTrainingForm({
                  ...trainingForm,
                  modality: event.target.value as TrainingModality,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Carga horária
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={trainingForm.workloadHours}
              onChange={(event) =>
                setTrainingForm({
                  ...trainingForm,
                  workloadHours: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Situação</span>
            <select
              value={trainingForm.status}
              onChange={(event) =>
                setTrainingForm({
                  ...trainingForm,
                  status: event.target.value as TrainingStatus,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              disabled={editingTraining?.status === "cancelled"}
            >
              {Object.entries(STATUS_LABELS)
                .filter(([value]) => value !== "cancelled" || editingTraining)
                .map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Descrição</span>
            <textarea
              rows={3}
              value={trainingForm.description}
              onChange={(event) =>
                setTrainingForm({
                  ...trainingForm,
                  description: event.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        wide
        title={detail?.title || "Treinamento"}
        description={
          detail
            ? `${MODALITY_LABELS[detail.modality]} · ${detail.workload_hours}h · ${
                STATUS_LABELS[detail.status]?.label || detail.status
              }`
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
            {detail && canManage && detail.status !== "cancelled" && (
              <>
                <button
                  type="button"
                  onClick={() => openEditTraining(detail)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void cancelTrainingAction(detail)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar treinamento
                </button>
              </>
            )}
          </>
        }
      >
        {detailLoading ? (
          <DataState variant="loading" compact />
        ) : detail ? (
          <div className="space-y-6">
            {detail.description && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {detail.description}
              </p>
            )}

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <CalendarPlus className="h-4 w-4" />
                  Turmas
                </h3>
                {canManage && detail.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={openSessionModal}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova turma
                  </button>
                )}
              </div>
              {(detail.sessions || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma turma criada. Sem turma não há inscrição.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Turma</th>
                        <th className="px-3 py-2">Início / fim</th>
                        <th className="px-3 py-2">Local</th>
                        <th className="px-3 py-2 text-right">Inscritos</th>
                        <th className="px-3 py-2">Situação</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(detail.sessions || []).map((session) => (
                        <tr key={session.id}>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {session.title || `Turma #${session.id}`}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {formatDateTime(session.starts_at)}
                            <span className="block text-xs text-slate-400">
                              até {formatDateTime(session.ends_at)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {session.location || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700">
                            {session.enrollment_count}
                            {session.capacity ? ` / ${session.capacity}` : ""}
                          </td>
                          <td className="px-3 py-2">
                            {canManage ? (
                              <select
                                value={session.status}
                                disabled={actionLoading}
                                onChange={(event) =>
                                  void updateSessionStatus(
                                    session,
                                    event.target.value as TrainingSession["status"]
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                              >
                                <option value="scheduled">Agendada</option>
                                <option value="in_progress">Em andamento</option>
                                <option value="completed">Concluída</option>
                                <option value="cancelled">Cancelada</option>
                              </select>
                            ) : (
                              <StatusBadge label={session.status} tone="blue" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {canManage &&
                              detail.status !== "cancelled" &&
                              session.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => openEnrollModal(session)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Inscrever
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Award className="h-4 w-4" />
                  Participantes
                </h3>
                {canManage &&
                  detail.status !== "cancelled" &&
                  (detail.sessions || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => openEnrollModal()}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Nova inscrição
                    </button>
                  )}
              </div>
              {(detail.enrollments || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum participante inscrito neste treinamento.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Participante</th>
                        <th className="px-3 py-2">Vínculo / CNPJ</th>
                        <th className="px-3 py-2">Turma</th>
                        <th className="px-3 py-2">Situação</th>
                        <th className="px-3 py-2">Nota / certificado</th>
                        <th className="px-3 py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(detail.enrollments || []).map((enrollment) => (
                        <tr key={enrollment.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900">
                              {enrollment.contributor_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {enrollment.position_title || "Sem cargo"}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            Vínculo #{enrollment.employment_link_id}
                            <span className="block">
                              {enrollment.legal_name || "—"} ·{" "}
                              {enrollment.cnpj || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {enrollment.session_title ||
                              formatDateTime(enrollment.starts_at)}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge
                              label={
                                ENROLLMENT_LABELS[enrollment.status]?.label ||
                                enrollment.status
                              }
                              tone={
                                ENROLLMENT_LABELS[enrollment.status]?.tone || "slate"
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {enrollment.grade !== null &&
                            enrollment.grade !== undefined
                              ? `Nota ${enrollment.grade}`
                              : "Sem nota"}
                            {enrollment.certificate_code && (
                              <span className="mt-0.5 block font-mono text-[11px] text-violet-700">
                                {enrollment.certificate_code}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap justify-end gap-1">
                              {enrollment.certificate_code && <button type="button" disabled={actionLoading}
                                onClick={() => void downloadCertificate(enrollment)}
                                className="rounded border border-violet-200 px-2 py-1 text-xs text-violet-700 disabled:opacity-50">Baixar certificado</button>}
                              {canManage &&
                                ["enrolled", "attended", "absent"].includes(
                                  enrollment.status
                                ) && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() =>
                                        void attendance(enrollment, "attended")
                                      }
                                      className="rounded border border-emerald-300 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                    >
                                      Presente
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() =>
                                        void attendance(enrollment, "absent")
                                      }
                                      className="rounded border border-rose-300 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                      Ausente
                                    </button>
                                  </>
                                )}
                              {canManage && enrollment.status === "attended" && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => void completeEnrollment(enrollment)}
                                  className="inline-flex items-center gap-1 rounded border border-blue-300 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Concluir
                                </button>
                              )}
                              {canManage &&
                                enrollment.status === "completed" &&
                                !enrollment.certificate_code && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => void certificate(enrollment)}
                                    className="inline-flex items-center gap-1 rounded border border-violet-300 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                                  >
                                    <Award className="h-3 w-3" />
                                    Certificado
                                  </button>
                                )}
                              {canManage &&
                                ["enrolled", "attended", "absent"].includes(
                                  enrollment.status
                                ) && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => void cancelEnrollment(enrollment)}
                                    className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                    title="Cancelar inscrição"
                                  >
                                    <UserX className="inline h-3 w-3" />
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
            </section>
          </div>
        ) : (
          <DataState variant="empty" compact />
        )}
      </Modal>

      <Modal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title="Nova turma"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSessionModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="training-session-form"
              disabled={savingSession}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingSession ? "Salvando..." : "Criar turma"}
            </button>
          </>
        }
      >
        <form
          id="training-session-form"
          onSubmit={submitSession}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">
              Título (opcional)
            </span>
            <input
              value={sessionForm.title}
              onChange={(event) =>
                setSessionForm({ ...sessionForm, title: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Turma 1, manhã..."
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Início</span>
            <input
              type="datetime-local"
              required
              value={sessionForm.startsAt}
              onChange={(event) =>
                setSessionForm({ ...sessionForm, startsAt: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Término</span>
            <input
              type="datetime-local"
              required
              value={sessionForm.endsAt}
              onChange={(event) =>
                setSessionForm({ ...sessionForm, endsAt: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Local</span>
            <input
              value={sessionForm.location}
              onChange={(event) =>
                setSessionForm({ ...sessionForm, location: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Capacidade</span>
            <input
              type="number"
              min="1"
              step="1"
              value={sessionForm.capacity}
              onChange={(event) =>
                setSessionForm({ ...sessionForm, capacity: event.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Sem limite"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Inscrever participante"
        description="A inscrição usa o vínculo empregatício e o CNPJ empregador; não é possível inscrever convidado sem vínculo."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="training-enrollment-form"
              disabled={savingEnrollment}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingEnrollment ? "Inscrevendo..." : "Inscrever"}
            </button>
          </>
        }
      >
        <form
          id="training-enrollment-form"
          onSubmit={submitEnrollment}
          className="space-y-3"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Turma</span>
            <select
              required
              value={enrollSessionId}
              onChange={(event) => setEnrollSessionId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Selecione...</option>
              {(detail?.sessions || [])
                .filter((session) => session.status !== "cancelled")
                .map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title || formatDateTime(session.starts_at)} ·{" "}
                    {session.enrollment_count}
                    {session.capacity ? `/${session.capacity}` : ""} inscrito(s)
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Colaborador vinculado ao CNPJ
            </span>
            <select
              required
              value={enrollLinkId}
              onChange={(event) => setEnrollLinkId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Selecione...</option>
              {filteredContributors.map((contributor) => (
                <option
                  key={contributor.employment_link_id}
                  value={contributor.employment_link_id || ""}
                >
                  {contributor.username} · {contributor.position_title || "Sem cargo"} ·{" "}
                  {contributor.employer_cnpj || "CNPJ"}
                </option>
              ))}
            </select>
            {filteredContributors.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                Nenhum colaborador com vínculo ativo neste CNPJ. Cadastre o vínculo no
                RH antes de inscrever.
              </span>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Observações
            </span>
            <textarea
              rows={2}
              value={enrollNotes}
              onChange={(event) => setEnrollNotes(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="flex items-center gap-1 font-semibold text-slate-700">
              <ClipboardCheck className="h-3.5 w-3.5" /> Presença e conclusão
            </p>
            <p className="mt-1">
              A presença não conclui automaticamente. A conclusão exige presença e
              habilita a emissão do certificado.
            </p>
          </div>
        </form>
      </Modal>
    </Dashboard>
  );
}
