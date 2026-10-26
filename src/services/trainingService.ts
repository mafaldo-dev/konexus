import { apiClient, ApiResponse } from "../api/client";
import { asList, asObject, pickData } from "../api/payload";

export type TrainingStatus =
  | "draft"
  | "published"
  | "in_progress"
  | "completed"
  | "cancelled";
export type TrainingModality = "presencial" | "online" | "hibrido";
export type EnrollmentStatus =
  | "enrolled"
  | "attended"
  | "absent"
  | "completed"
  | "cancelled";

export interface TrainingCategory {
  id: number;
  name: string;
  description?: string | null;
  active: boolean;
  training_count: number;
}

export interface TrainingSession {
  id: number;
  training_id: number;
  title?: string | null;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  capacity?: number | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  enrollment_count: number;
}

export interface TrainingEnrollment {
  id: number;
  session_id: number;
  contributor_id: number;
  employment_link_id: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  attendance_at?: string | null;
  completed_at?: string | null;
  grade?: number | null;
  notes?: string | null;
  contributor_name: string;
  session_title?: string | null;
  starts_at?: string;
  position_title?: string | null;
  legal_entity_id?: number;
  legal_name?: string | null;
  cnpj?: string | null;
  certificate_code?: string | null;
  certificate_issued_at?: string | null;
}

export interface Training {
  id: number;
  category_id?: number | null;
  category_name?: string | null;
  title: string;
  description?: string | null;
  instructor_name?: string | null;
  modality: TrainingModality;
  workload_hours: number;
  status: TrainingStatus;
  session_count: number;
  enrollment_count: number;
  completed_count: number;
  next_session_at?: string | null;
  created_at: string;
  sessions?: TrainingSession[];
  enrollments?: TrainingEnrollment[];
}

export interface TrainingSummary {
  trainings: number;
  published: number;
  inProgress: number;
  completedTrainings: number;
  completedEnrollments: number;
  certificates: number;
  upcomingSessions: number;
}

export interface TrainingInput {
  title: string;
  categoryId?: number | string | null;
  description?: string;
  instructorName?: string;
  modality: TrainingModality;
  workloadHours: number;
  status: TrainingStatus;
}

const base = "rh/trainings";

export interface TrainingCertificate {
  id: number;
  code: string;
  issued_at: string;
  snapshot: Record<string, unknown>;
}

export async function getTrainingCertificate(enrollmentId: number): Promise<ApiResponse<TrainingCertificate>> {
  return pickData(await apiClient.get(`${base}/enrollments/${enrollmentId}/certificate`), body => body?.data, 'certificado do treinamento');
}

export async function downloadTrainingCertificate(certificate: TrainingCertificate) {
  const {jsPDF} = await import('jspdf');
  const pdf = new jsPDF();
  const snapshot = certificate.snapshot;
  let y = 25;
  const line = (text: string, size = 12) => {
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(text, 170);
    for (const part of lines) {
      if (y > 275) { pdf.addPage(); y = 25; }
      pdf.text(part, 20, y);
      y += size * 0.5 + 2;
    }
    y += 4;
  };
  const value = (key: string) => snapshot[key] == null ? 'Não informado' : String(snapshot[key]);
  const date = (raw: unknown) => raw && Number.isFinite(Date.parse(String(raw))) ? new Date(String(raw)).toLocaleDateString('pt-BR') : 'Não informada';
  line('CERTIFICADO DE TREINAMENTO', 20);
  line(value('employerLegalName'), 14);
  line(`CNPJ: ${value('employerCnpj')}`);
  line(`Participante: ${value('contributorName')}`, 14);
  line(`Treinamento: ${value('trainingTitle')}`);
  if (snapshot.sessionTitle) line(`Turma: ${value('sessionTitle')}`);
  line(`Modalidade: ${value('modality')} · Carga horária: ${value('workloadHours')} horas`);
  line(`Período: ${date(snapshot.startsAt)} a ${date(snapshot.endsAt)}`);
  line(`Conclusão: ${date(snapshot.completedAt)}`);
  if (snapshot.grade != null) line(`Nota: ${value('grade')}`);
  line(`Emitido em: ${date(certificate.issued_at)}`);
  line(`Código do registro: ${certificate.code}`, 10);
  line('Documento gerado a partir dos dados preservados na emissão do certificado no Konexus.', 10);
  pdf.save(`certificado-${certificate.id}.pdf`);
}

export async function listTrainingCategories(): Promise<
  ApiResponse<TrainingCategory[]>
> {
  return asList<TrainingCategory>(
    await apiClient.get(`${base}/categories`),
    ["data"],
    "categorias de treinamento"
  );
}

export async function createTrainingCategory(payload: {
  name: string;
  description?: string;
}): Promise<ApiResponse<TrainingCategory>> {
  return asObject<TrainingCategory>(
    await apiClient.post(`${base}/categories`, { ...payload, active: true }),
    ["data"],
    "categoria de treinamento"
  );
}

export async function getTrainingSummary(): Promise<ApiResponse<TrainingSummary>> {
  return pickData<TrainingSummary>(
    await apiClient.get(`${base}/summary`),
    (body) => body?.data,
    "resumo de treinamentos"
  );
}

export async function listTrainings(filters: {
  status?: string;
  categoryId?: number | string;
  search?: string;
} = {}): Promise<ApiResponse<Training[]>> {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status) params.append("status", filters.status);
  if (filters.categoryId) params.append("categoryId", String(filters.categoryId));
  if (filters.search) params.append("search", filters.search);
  return asList<Training>(
    await apiClient.get(`${base}?${params.toString()}`),
    ["data"],
    "treinamentos"
  );
}

export async function getTraining(id: number | string): Promise<ApiResponse<Training>> {
  return asObject<Training>(
    await apiClient.get(`${base}/${id}`),
    ["data"],
    "treinamento"
  );
}

export async function createTraining(
  payload: TrainingInput
): Promise<ApiResponse<Training>> {
  return asObject<Training>(
    await apiClient.post(base, payload),
    ["data"],
    "treinamento criado"
  );
}

export async function updateTraining(
  id: number | string,
  payload: Partial<TrainingInput>
): Promise<ApiResponse<Training>> {
  return asObject<Training>(
    await apiClient.patch(`${base}/${id}`, payload),
    ["data"],
    "treinamento atualizado"
  );
}

export async function cancelTraining(
  id: number | string,
  reason?: string
): Promise<ApiResponse<Training>> {
  return asObject<Training>(
    await apiClient.post(`${base}/${id}/cancel`, { reason }),
    ["data"],
    "cancelamento do treinamento"
  );
}

export async function createTrainingSession(
  trainingId: number | string,
  payload: {
    title?: string;
    startsAt: string;
    endsAt: string;
    location?: string;
    capacity?: number | string | null;
  }
): Promise<ApiResponse<TrainingSession>> {
  return asObject<TrainingSession>(
    await apiClient.post(`${base}/${trainingId}/sessions`, payload),
    ["data"],
    "turma do treinamento"
  );
}

export async function updateTrainingSession(
  sessionId: number | string,
  payload: Partial<{
    title: string;
    startsAt: string;
    endsAt: string;
    location: string;
    capacity: number | string | null;
    status: TrainingSession["status"];
  }>
): Promise<ApiResponse<TrainingSession>> {
  return asObject<TrainingSession>(
    await apiClient.patch(`${base}/sessions/${sessionId}`, payload),
    ["data"],
    "turma atualizada"
  );
}

export async function enrollTraining(
  sessionId: number | string,
  employmentLinkId: number | string,
  notes?: string
): Promise<ApiResponse<TrainingEnrollment>> {
  return asObject<TrainingEnrollment>(
    await apiClient.post(`${base}/sessions/${sessionId}/enrollments`, {
      employmentLinkId,
      notes,
    }),
    ["data"],
    "inscrição no treinamento"
  );
}

export async function setTrainingAttendance(
  enrollmentId: number | string,
  status: "attended" | "absent"
): Promise<ApiResponse<TrainingEnrollment>> {
  return asObject<TrainingEnrollment>(
    await apiClient.patch(`${base}/enrollments/${enrollmentId}/attendance`, {
      status,
    }),
    ["data"],
    "presença no treinamento"
  );
}

export async function completeTrainingEnrollment(
  enrollmentId: number | string,
  grade?: number | string | null
): Promise<ApiResponse<TrainingEnrollment>> {
  return asObject<TrainingEnrollment>(
    await apiClient.post(`${base}/enrollments/${enrollmentId}/complete`, {
      grade,
    }),
    ["data"],
    "conclusão do treinamento"
  );
}

export async function cancelTrainingEnrollment(
  enrollmentId: number | string,
  reason?: string
): Promise<ApiResponse<TrainingEnrollment>> {
  return asObject<TrainingEnrollment>(
    await apiClient.post(`${base}/enrollments/${enrollmentId}/cancel`, {
      reason,
    }),
    ["data"],
    "cancelamento da inscrição"
  );
}

export async function issueTrainingCertificate(
  enrollmentId: number | string
): Promise<ApiResponse<{
  id: number;
  code: string;
  issued_at: string;
  snapshot: Record<string, unknown>;
  replayed: boolean;
}>> {
  return pickData(
    await apiClient.post(`${base}/enrollments/${enrollmentId}/certificate`),
    (body) => body?.data,
    "certificado do treinamento"
  );
}
