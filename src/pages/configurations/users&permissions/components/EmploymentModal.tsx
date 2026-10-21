import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, History, Loader2, UserRoundCheck, X } from "lucide-react";
import {
  Collaborator,
  createEmploymentLink,
  EmploymentLink,
  endEmploymentLink,
  listEmploymentLinks,
  updateEmploymentLink,
} from "../../../../services/collaboratorService";
import { LegalEntity, listLegalEntities } from "../../../../services/legalEntityService";

interface Props {
  open: boolean;
  onClose: () => void;
  collaborator: Collaborator | null;
  onSaved: () => Promise<void> | void;
}

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(String(value).slice(0, 10) + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function formatCnpj(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "CNPJ não informado";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export default function EmploymentModal({ open, onClose, collaborator, onSaved }: Props) {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [links, setLinks] = useState<EmploymentLink[]>([]);
  const [legalEntityId, setLegalEntityId] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [startedAt, setStartedAt] = useState(today());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => links.find((link) => link.status === "active") || null,
    [links]
  );
  const history = useMemo(
    () => links.filter((link) => link.status !== "active"),
    [links]
  );
  const employerChanged = Boolean(
    active && legalEntityId && Number(active.legal_entity_id) !== Number(legalEntityId)
  );

  const load = async () => {
    if (!collaborator) return;
    setLoading(true);
    setError(null);
    try {
      const [linksResponse, entitiesResponse] = await Promise.all([
        listEmploymentLinks(collaborator.id),
        listLegalEntities(),
      ]);
      if (!linksResponse.ok) {
        throw new Error(linksResponse.error || "Não foi possível carregar o vínculo empregatício.");
      }
      if (!entitiesResponse.ok || !entitiesResponse.data) {
        throw new Error(entitiesResponse.error || "Não foi possível carregar os CNPJs.");
      }
      const linkList = linksResponse.data || [];
      const current = linkList.find((link) => link.status === "active") || null;
      setLinks(linkList);
      setEntities(entitiesResponse.data.entities || []);
      setLegalEntityId(
        current?.legal_entity_id
          ? String(current.legal_entity_id)
          : collaborator.legal_entity_id
            ? String(collaborator.legal_entity_id)
            : ""
      );
      setPositionTitle(current?.position_title || collaborator.position_title || "");
      setDepartment(current?.department || collaborator.department || "");
      setCostCenter(current?.cost_center || collaborator.cost_center || "");
      setStartedAt(current?.started_at ? String(current.started_at).slice(0, 10) : today());
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar o vínculo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !collaborator) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collaborator?.id]);

  if (!open || !collaborator) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!legalEntityId) {
      setError("Selecione a empresa empregadora (CNPJ).");
      return;
    }
    if (!active && !startedAt) {
      setError("Informe a data de início do vínculo.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        positionTitle: positionTitle.trim() || undefined,
        department: department.trim() || undefined,
        costCenter: costCenter.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      let response;
      if (active && !employerChanged) {
        response = await updateEmploymentLink(active.id, payload);
      } else {
        response = await createEmploymentLink({
          contributorId: collaborator.id,
          legalEntityId: Number(legalEntityId),
          startedAt: startedAt || today(),
          ...payload,
        });
      }
      if (!response.ok) {
        throw new Error(response.error || "Não foi possível salvar o vínculo.");
      }
      await load();
      await onSaved();
    } catch (err: any) {
      setError(err.message || "Não foi possível salvar o vínculo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnd = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);
    try {
      const response = await endEmploymentLink(active.id, { endedAt: today() });
      if (!response.ok) {
        throw new Error(response.error || "Não foi possível encerrar o vínculo.");
      }
      await load();
      await onSaved();
    } catch (err: any) {
      setError(err.message || "Não foi possível encerrar o vínculo.");
    } finally {
      setSaving(false);
    }
  };

  const selectableEntities = entities.filter(
    (entity) =>
      entity.status === "active" ||
      (active && Number(entity.id) === Number(active.legal_entity_id))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vínculo empregatício</h2>
              <p className="text-xs text-slate-500">
                {collaborator.username} · o empregador é definido pelo vínculo, não pelo seletor global.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando vínculo...
            </div>
          ) : (
            <>
              <div
                className={`rounded-xl border p-4 ${
                  active
                    ? "border-indigo-100 bg-indigo-50/60"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 text-indigo-700" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {active
                        ? `${active.trade_name || active.legal_name}`
                        : "Sem vínculo empregatício ativo"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {active
                        ? `${active.legal_name} · ${formatCnpj(active.cnpj)} · desde ${formatDate(active.started_at)}`
                        : "O colaborador pode ter acesso ao sistema sem vínculo de emprego. Crie o vínculo somente quando houver relação de trabalho."}
                    </p>
                    {active?.position_title || active?.department || active?.cost_center ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {[active.position_title, active.department, active.cost_center]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Empresa empregadora (CNPJ)
                    </span>
                    <select
                      value={legalEntityId}
                      onChange={(event) => setLegalEntityId(event.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="">Selecione o CNPJ empregador</option>
                      {selectableEntities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.tradeName || entity.legalName} ·{" "}
                          {entity.cnpjFormatted || entity.cnpj}
                          {entity.status !== "active"
                            ? ` (${entity.status === "regularization" ? "em regularização" : "inativo"})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {employerChanged ? (
                      <span className="mt-1 block text-xs text-amber-700">
                        Ao salvar, o vínculo atual será encerrado com data anterior e um novo
                        vínculo será criado. O histórico será preservado; nenhum dado é apagado
                        ou transferido entre CNPJs.
                      </span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cargo / função
                    </span>
                    <input
                      value={positionTitle}
                      onChange={(event) => setPositionTitle(event.target.value)}
                      maxLength={150}
                      placeholder="Ex.: Vendedor interno"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Departamento / setor
                    </span>
                    <input
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      maxLength={150}
                      placeholder="Ex.: Comercial"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Centro de custo
                    </span>
                    <input
                      value={costCenter}
                      onChange={(event) => setCostCenter(event.target.value)}
                      maxLength={120}
                      placeholder="Ex.: CC-COM-01"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {active ? "Início do vínculo atual" : "Início do vínculo"}
                    </span>
                    <input
                      type="date"
                      value={startedAt}
                      onChange={(event) => setStartedAt(event.target.value)}
                      disabled={Boolean(active)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    {employerChanged ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        A data da transferência será o início do novo vínculo.
                      </span>
                    ) : null}
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Observações do vínculo
                    </span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={2000}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                  {active ? (
                    <button
                      type="button"
                      onClick={handleEnd}
                      disabled={saving}
                      className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Encerrar vínculo
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (!active && !legalEntityId)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {active
                      ? employerChanged
                        ? "Transferir empregador"
                        : "Salvar vínculo"
                      : "Criar vínculo"}
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-100 p-4">
                  <History className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">Histórico de vínculos</h3>
                </div>
                {history.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">Nenhum vínculo anterior.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map((link) => (
                      <div key={link.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {link.trade_name || link.legal_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {link.legal_name} · {formatCnpj(link.cnpj)} ·{" "}
                            {formatDate(link.started_at)} a {formatDate(link.ended_at)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[link.position_title, link.department, link.cost_center]
                              .filter(Boolean)
                              .join(" · ") || "Sem detalhes adicionais"}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {link.status === "transferred" ? "Transferido" : "Encerrado"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
