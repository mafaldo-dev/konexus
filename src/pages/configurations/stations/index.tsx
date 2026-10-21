import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  HardDrive,
  KeyRound,
  Loader2,
  Monitor,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import Dashboard from "../../../components/dashboard/Dashboard";
import Computers from './Computers';
import {
  WorkStation,
  createStationPairingCode,
  createWorkStation,
  getStationToken,
  listWorkStations,
  revokeStationTokens,
  saveStationToken,
  updateWorkStation,
} from "../../../services/auditService";

/**
 * Tela de estacoes de trabalho.
 *
 * A estacao identifica o AMBIENTE em que a sessao foi aberta (por exemplo,
 * "Expedicao - Maquina 3"). Ela NAO e prova de identidade: a confirmacao de
 * senha continua sendo exigida pelo backend nas operacoes protegidas.
 */
export default function WorkStationsPage() {
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [saving, setSaving] = useState(false);
  const [pairingCode, setPairingCode] = useState<{
    station: string;
    code: string;
  } | null>(null);
  const [linkCode, setLinkCode] = useState("");
  const [linkedCode, setLinkedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await listWorkStations();
    if (response.ok) {
      setStations(response.data || []);
    } else {
      setStations([]);
      setError(response.error || "Não foi possível carregar as estações.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    setLinkedCode(getStationToken());
  }, [load]);

  const handleCreate = async () => {
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);

    const response = await createWorkStation({
      name: name.trim(),
      sector: sector.trim() || undefined,
    });

    if (response.ok && response.data) {
      setName("");
      setSector("");
      await load();
    } else {
      setError(response.error || "Não foi possível cadastrar a estação.");
    }

    setSaving(false);
  };

  const handlePairing = async (station: WorkStation) => {
    setError(null);
    const response = await createStationPairingCode(station.id, "Pareamento");

    if (response.ok && response.data) {
      setPairingCode({
        station: response.data.station.name,
        code: response.data.code,
      });
    } else {
      setError(response.error || "Não foi possível gerar o código.");
    }
  };

  const handleLink = () => {
    if (!linkCode.trim()) return;
    saveStationToken(linkCode.trim());
    setLinkedCode(linkCode.trim());
    setLinkCode("");
  };

  const handleToggle = async (station: WorkStation) => {
    setError(null);
    const response = await updateWorkStation(station.id, {
      active: !station.active,
    });

    if (!response.ok) {
      setError(response.error || "Não foi possível atualizar a estação.");
      return;
    }

    if (station.active) {
      await revokeStationTokens(station.id);
    }

    await load();
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <Computers />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Monitor className="h-4 w-4" />
                Rastreabilidade
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Estações de trabalho
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Cadastre os postos de trabalho e vincule cada computador a uma
                estação. O histórico passa a mostrar em qual posto a sessão
                estava aberta.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Atualizar
            </button>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Cadastrar estação
              </h2>
              <div className="mt-3 space-y-3">
                <label className="block text-xs font-medium text-slate-600">
                  Nome do posto
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Expedição - Máquina 3"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Setor ou local (opcional)
                  <input
                    type="text"
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                    placeholder="Ex.: Expedição"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Vincular este computador
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Informe o código gerado para a estação. Ele fica guardado
                apenas neste computador.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={linkCode}
                  onChange={(event) => setLinkCode(event.target.value.toUpperCase())}
                  placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
                />
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={!linkCode.trim()}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:opacity-60"
                >
                  Vincular
                </button>
              </div>
              {linkedCode ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Este computador está vinculado a uma estação
                  ({linkedCode.slice(0, 6)}-…).
                </p>
              ) : (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
                  Este computador ainda não está vinculado a uma estação. As
                  operações continuam registradas, mas sem a identificação do
                  posto.
                </p>
              )}
            </div>
          </div>

          {pairingCode ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <h2 className="text-sm font-semibold text-blue-900">
                Código de pareamento para {pairingCode.station}
              </h2>
              <p className="mt-1 text-xs text-blue-800">
                Anote o código: ele é exibido uma única vez.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <code className="rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-800">
                  {pairingCode.code}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(pairingCode.code);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando as estações...
              </div>
            ) : stations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-sm text-slate-500">
                <HardDrive className="h-6 w-6 text-slate-300" />
                Nenhuma estação cadastrada ainda.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Estação</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Situação</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stations.map((station) => (
                    <tr key={station.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {station.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {station.sector || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            station.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {station.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handlePairing(station)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Gerar código
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(station)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            {station.active ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}
