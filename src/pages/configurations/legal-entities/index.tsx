import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import Dashboard from "../../../components/dashboard/Dashboard";
import { useAuth } from "../../../AuthContext";
import {
  createLegalEntity,
  getLegalEntity,
  LegalEntity,
  LegalEntityInput,
  LEGAL_ENTITY_STATUS_LABEL,
  listLegalEntities,
  loadLegalEntityLogo,
  LegalEntityCapacity,
  LegalEntityRequest,
  removeLegalEntityLogo,
  requestLegalEntityCapacity,
  setLegalEntityStatus,
  TAX_REGIME_LABEL,
  updateLegalEntity,
  uploadLegalEntityLogo,
} from "../../../services/legalEntityService";
import { apiClient } from "../../../api/client";

const emptyForm: LegalEntityInput = {
  legalName: "",
  tradeName: "",
  cnpj: "",
  stateRegistration: "",
  municipalRegistration: "",
  taxRegime: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  cityCode: "",
  state: "",
  zip: "",
  email: "",
  phone: "",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    regularization: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.inactive}`}>
      {LEGAL_ENTITY_STATUS_LABEL[status] || status}
    </span>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export default function LegalEntitiesPage() {
  const { isCompanyAdmin, user } = useAuth();
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [capacity, setCapacity] = useState<LegalEntityCapacity | null>(null);
  const [requests, setRequests] = useState<LegalEntityRequest[]>([]);
  const [logos, setLogos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LegalEntity | null>(null);
  const [form, setForm] = useState<LegalEntityInput>(emptyForm);
  const [logoEntity, setLogoEntity] = useState<LegalEntity | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [accessEntity, setAccessEntity] = useState<LegalEntity | null>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [selectedAccess, setSelectedAccess] = useState<number[]>([]);
  const [accessOriginal, setAccessOriginal] = useState<number[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportNotes, setSupportNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canManage = Boolean(isCompanyAdmin) || user?.role === "Administrador";

  const load = async () => {
    try {
      setLoading(true);
      const response = await listLegalEntities();
      if (!response.ok || !response.data) {
        throw new Error(response.error || "Não foi possível carregar as empresas.");
      }
      setEntities(response.data.entities || []);
      setCapacity(response.data.capacity || null);
      setRequests(response.data.requests || []);
      const loaded: Record<number, string> = {};
      await Promise.all(
        (response.data.entities || []).map(async (entity) => {
          if (!entity.hasLogo) return;
          const url = await loadLegalEntityLogo(entity);
          if (url) loaded[entity.id] = url;
        })
      );
      setLogos(loaded);
    } catch (error: any) {
      await Swal.fire("Erro", error.message || "Falha ao carregar empresas / CNPJs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) void load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const used = capacity?.active ?? entities.filter((e) => e.status === "active").length;
  const limit = capacity?.limit ?? 1;
  const available = capacity?.available ?? Math.max(0, limit - used);
  const hasPendingRequest = useMemo(
    () => requests.some((request) => request.status === "pending"),
    [requests]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = async (entity: LegalEntity) => {
    try {
      const response = await getLegalEntity(entity.id);
      const data = response.data?.entity || entity;
      setEditing(data);
      setForm({
        legalName: data.legalName || "",
        tradeName: data.tradeName || "",
        cnpj: data.cnpj || "",
        stateRegistration: data.stateRegistration || "",
        municipalRegistration: data.municipalRegistration || "",
        taxRegime: data.taxRegime || "",
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        district: data.district || "",
        city: data.city || "",
        cityCode: data.cityCode || "",
        state: data.state || "",
        zip: data.zip || "",
        email: data.email || "",
        phone: data.phone || "",
      });
      setFormOpen(true);
    } catch {
      await Swal.fire("Erro", "Não foi possível carregar a empresa.", "error");
    }
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.legalName.trim()) {
      await Swal.fire("Atenção", "Informe a razão social.", "warning");
      return;
    }
    try {
      setSaving(true);
      const response = editing
        ? await updateLegalEntity(editing.id, form)
        : await createLegalEntity(form);
      if (!response.ok) throw new Error(response.error || "Falha ao salvar empresa.");
      await Swal.fire("Sucesso", editing ? "Empresa atualizada." : "Empresa incluída. O CNPJ já pode ser selecionado para novas operações.", "success");
      setFormOpen(false);
      await load();
    } catch (error: any) {
      await Swal.fire("Não foi possível salvar", error.message || "Verifique os dados e a capacidade contratada.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (entity: LegalEntity) => {
    const next = entity.status === "active" ? "inactive" : "active";
    const result = await Swal.fire({
      title: next === "active" ? "Ativar CNPJ?" : "Desativar CNPJ?",
      html: next === "active"
        ? "A empresa voltará a emitir novas operações, respeitando a capacidade contratada."
        : "Nenhum documento, saldo ou histórico será excluído. Apenas novas operações deixarão de ser permitidas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: next === "active" ? "Ativar" : "Desativar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await setLegalEntityStatus(entity.id, next);
      if (!response.ok) throw new Error(response.error || "Falha ao alterar status.");
      await Swal.fire("Status atualizado", `Empresa ${next === "active" ? "ativada" : "desativada"}.`, "success");
      await load();
    } catch (error: any) {
      await Swal.fire("Erro", error.message, "error");
    }
  };

  const openLogo = (entity: LegalEntity) => {
    setLogoEntity(entity);
    setLogoFile(null);
    setLogoPreview(logos[entity.id] || null);
  };

  const chooseLogo = (file: File | null) => {
    setLogoFile(file);
    if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : logos[logoEntity?.id || 0] || null);
  };

  const saveLogo = async () => {
    if (!logoEntity || !logoFile) return;
    try {
      setSaving(true);
      const response = await uploadLegalEntityLogo(logoEntity.id, logoFile);
      if (!response.ok) throw new Error(response.error || "Falha ao enviar logotipo.");
      await Swal.fire("Logotipo atualizado", "O novo logo será usado nos próximos documentos desta empresa. Documentos já emitidos preservam a identidade original.", "success");
      setLogoEntity(null);
      setLogoFile(null);
      await load();
    } catch (error: any) {
      await Swal.fire("Erro", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteLogo = async () => {
    if (!logoEntity) return;
    const result = await Swal.fire({
      title: "Remover logotipo?",
      text: "Os documentos passarão a usar o cabeçalho textual com razão social e CNPJ. Documentos históricos não são alterados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await removeLegalEntityLogo(logoEntity.id);
      if (!response.ok) throw new Error(response.error || "Falha ao remover logotipo.");
      setLogoEntity(null);
      await Swal.fire("Logotipo removido", "A empresa usará o cabeçalho textual.", "success");
      await load();
    } catch (error: any) {
      await Swal.fire("Erro", error.message, "error");
    }
  };

  const openAccess = async (entity: LegalEntity) => {
    try {
      setAccessEntity(entity);
      const [people, access] = await Promise.all([
        apiClient.get("collaborators"),
        apiClient.get(`legal-entities/${entity.id}/access`),
      ]);
      setCollaborators(people.data?.data || []);
      const current = (access.data?.access || []).map((row: any) => Number(row.contributor_id));
      setSelectedAccess(current);
      setAccessOriginal(current);
    } catch {
      await Swal.fire("Erro", "Não foi possível carregar os acessos.", "error");
    }
  };

  const saveAccess = async () => {
    if (!accessEntity) return;
    try {
      setSaving(true);
      const toGrant = selectedAccess.filter((id) => !accessOriginal.includes(id));
      const toRevoke = accessOriginal.filter((id) => !selectedAccess.includes(id));
      for (const contributorId of toGrant) {
        const response = await apiClient.put(`legal-entities/${accessEntity.id}/access`, { contributorIds: [contributorId] });
        if (!response.ok) throw new Error(response.error || "Falha ao conceder acesso.");
      }
      for (const contributorId of toRevoke) {
        const response = await apiClient.delete(`legal-entities/${accessEntity.id}/access/${contributorId}`);
        if (!response.ok) throw new Error(response.error || "Falha ao revogar acesso.");
      }
      await Swal.fire("Acessos atualizados", "As concessões foram registradas na auditoria.", "success");
      setAccessEntity(null);
    } catch (error: any) {
      await Swal.fire("Erro", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const submitSupportRequest = async () => {
    try {
      setSaving(true);
      const response = await requestLegalEntityCapacity(supportNotes);
      if (!response.ok) throw new Error(response.error || "Falha ao registrar solicitação.");
      setSupportOpen(false);
      setSupportNotes("");
      await Swal.fire("Solicitação registrada", "O suporte entrará em contato. Nenhuma cobrança automática foi realizada.", "success");
      await load();
    } catch (error: any) {
      await Swal.fire("Erro", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <Dashboard>
        <div className="mx-auto max-w-3xl py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-2 text-slate-600">Apenas o administrador da organização pode gerenciar empresas / CNPJs.</p>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Empresas / CNPJs</h1>
              <p className="mt-1 max-w-3xl text-slate-600">
                A organização contratante compartilha clientes, fornecedores, catálogo, CRM, usuários e permissões.
                Estoque, financeiro, fiscal, contábil e documentos são segregados por empresa jurídica.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {capacity?.canAdd ? (
                <button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  + Nova empresa
                </button>
              ) : (
                <button onClick={() => setSupportOpen(true)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                  Solicitar novo CNPJ ao suporte
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Carregando empresas...</div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacidade contratada</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{limit}</p>
                  <p className="text-xs text-slate-500">teto comercial de 3 CNPJs</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CNPJs ativos</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{used}</p>
                  <p className="text-xs text-slate-500">inclui a empresa principal</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponíveis</p>
                  <p className={`mt-1 text-3xl font-bold ${available > 0 ? "text-emerald-600" : "text-amber-600"}`}>{available}</p>
                  <p className="text-xs text-slate-500">{available > 0 ? "novas inclusões permitidas" : "requer autorização do suporte"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contrato</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{capacity?.contractStatus || "active"}</p>
                  <p className="text-xs text-slate-500">{capacity?.multiCnpjEnabled ? "Multi-CNPJ habilitado" : "Freemium · 1 CNPJ"}</p>
                </div>
              </div>

              {hasPendingRequest && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Há uma solicitação de inclusão de CNPJ pendente. O suporte analisará a contratação; nada é cobrado automaticamente.
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {entities.map((entity) => (
                  <div key={entity.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-4 border-b border-slate-100 p-5">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {logos[entity.id] ? (
                          <img src={logos[entity.id]} alt={`Logo ${entity.tradeName || entity.legalName}`} className="max-h-14 max-w-14 object-contain" />
                        ) : (
                          <span className="text-xl font-bold text-slate-400">{(entity.tradeName || entity.legalName || "?").slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-slate-900">{entity.tradeName || entity.legalName}</h2>
                          {entity.isPrimary && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Principal</span>}
                          <StatusBadge status={entity.status} />
                        </div>
                        {entity.tradeName && entity.tradeName !== entity.legalName && (
                          <p className="truncate text-sm text-slate-600">{entity.legalName}</p>
                        )}
                        <p className="mt-1 text-sm font-medium text-slate-700">{entity.cnpjFormatted || entity.cnpj || "CNPJ não cadastrado"}</p>
                        <p className="text-xs text-slate-500">
                          {[entity.city, entity.state].filter(Boolean).join(" / ") || "Endereço não informado"}
                          {entity.stateRegistration ? ` · IE ${entity.stateRegistration}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 px-5 py-3 text-xs text-slate-500 sm:grid-cols-3">
                      <div><span className="block font-semibold text-slate-700">Regime</span>{TAX_REGIME_LABEL[entity.taxRegime || ""] || entity.taxRegime || "Não informado"}</div>
                      <div><span className="block font-semibold text-slate-700">Cadastrada em</span>{formatDate(entity.createdAt)}</div>
                      <div><span className="block font-semibold text-slate-700">Logo</span>{entity.hasLogo ? "Personalizado" : "Cabeçalho textual"}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                      <button onClick={() => openEdit(entity)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Editar</button>
                      <button onClick={() => openLogo(entity)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Logotipo</button>
                      <button onClick={() => openAccess(entity)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Acessos</button>
                      {!entity.isPrimary && (
                        <button onClick={() => toggleStatus(entity)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${entity.status === "active" ? "border border-red-200 bg-white text-red-700 hover:bg-red-50" : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"}`}>
                          {entity.status === "active" ? "Desativar" : "Ativar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Como funciona a contratação</h2>
                <ul className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <li>• O plano freemium opera com 1 CNPJ ativo.</li>
                  <li>• Organizações elegíveis podem contratar até 3 CNPJs no total, incluindo o principal.</li>
                  <li>• A inclusão adicional é autorizada pelo suporte. Não há checkout ou cobrança automática.</li>
                  <li>• Na redução da capacidade, os CNPJs excedentes entram em regularização: o histórico continua acessível, mas novas operações ficam bloqueadas.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form onSubmit={submitForm} className="my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editing ? "Editar empresa / CNPJ" : "Nova empresa / CNPJ"}</h2>
                <p className="text-xs text-slate-500">A capacidade contratada é validada pelo backend; este formulário não altera limites.</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <Field label="Razão social *"><input required value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Nome fantasia"><input value={form.tradeName || ""} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="CNPJ" hint={editing ? "O CNPJ não pode ser alterado após existir operação vinculada." : "14 dígitos; validado no backend."}><input value={form.cnpj || ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} disabled={Boolean(editing)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" /></Field>
              <Field label="Regime tributário"><select value={form.taxRegime || ""} onChange={(e) => setForm({ ...form, taxRegime: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Selecione</option>{Object.entries(TAX_REGIME_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Inscrição estadual"><input value={form.stateRegistration || ""} onChange={(e) => setForm({ ...form, stateRegistration: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Inscrição municipal"><input value={form.municipalRegistration || ""} onChange={(e) => setForm({ ...form, municipalRegistration: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="E-mail"><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Telefone"><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <div className="md:col-span-2"><h3 className="text-sm font-bold text-slate-800">Endereço fiscal</h3></div>
              <Field label="CEP"><input value={form.zip || ""} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Logradouro"><input value={form.street || ""} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Número"><input value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Complemento"><input value={form.complement || ""} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Bairro"><input value={form.district || ""} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Cidade"><input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="UF"><input maxLength={2} value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
              <Field label="Código IBGE da cidade"><input value={form.cityCode || ""} onChange={(e) => setForm({ ...form, cityCode: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}

      {logoEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Logotipo</h2>
                <p className="text-xs text-slate-500">{logoEntity.tradeName || logoEntity.legalName}</p>
              </div>
              <button onClick={() => setLogoEntity(null)} className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {logoPreview ? <img src={logoPreview} alt="Pré-visualização" className="max-h-32 max-w-full object-contain" /> : <p className="text-sm text-slate-500">Nenhum logotipo. O documento usará o cabeçalho textual.</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => chooseLogo(e.target.files?.[0] || null)} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Escolher imagem</button>
                {logoPreview && logoFile && <button type="button" onClick={saveLogo} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Enviando..." : "Enviar e otimizar"}</button>}
                {logoEntity.hasLogo && <button type="button" onClick={deleteLogo} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remover logotipo</button>}
              </div>
              <p className="text-xs text-slate-500">PNG, JPG/JPEG ou WebP, até 2 MB. A imagem é validada e otimizada no servidor, preservando transparência. O binário não é gravado na auditoria; apenas identificador e hash.</p>
            </div>
          </div>
        </div>
      )}

      {accessEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Acessos ao CNPJ</h2>
                <p className="text-xs text-slate-500">{accessEntity.tradeName || accessEntity.legalName}</p>
              </div>
              <button onClick={() => setAccessEntity(null)} className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto px-6 py-4">
              <p className="mb-2 text-xs text-slate-500">O administrador da organização sempre pode operar todas as empresas. Marque os demais colaboradores autorizados.</p>
              {collaborators.map((person) => (
                <label key={person.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedAccess.includes(Number(person.id))}
                    onChange={(e) => setSelectedAccess((current) => e.target.checked ? Array.from(new Set([...current, Number(person.id)])) : current.filter((id) => id !== Number(person.id)))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-800">{person.username}</span>
                    <span className="block text-xs text-slate-500">{person.role || person.sector || "Colaborador"} · {person.active === false ? "Inativo" : "Ativo"}</span>
                  </span>
                </label>
              ))}
              {!collaborators.length && <p className="text-sm text-slate-500">Nenhum colaborador encontrado.</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button onClick={() => setAccessEntity(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={saveAccess} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Salvando..." : "Salvar acessos"}</button>
            </div>
          </div>
        </div>
      )}

      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Solicitar inclusão de CNPJ</h2>
              <p className="text-xs text-slate-500">A capacidade é contratada com o suporte. Não há cobrança automática.</p>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Observações para o suporte</label>
              <textarea value={supportNotes} onChange={(e) => setSupportNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Informe quantos CNPJs adicionais a organização precisa e o contexto comercial." />
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Capacidade atual: {used} de {limit} CNPJs ativos. Teto comercial: 3. A solicitação não altera o limite nem libera operações até a confirmação do suporte.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button onClick={() => setSupportOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={submitSupportRequest} disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">{saving ? "Enviando..." : "Registrar solicitação"}</button>
            </div>
          </div>
        </div>
      )}
    </Dashboard>
  );
}
