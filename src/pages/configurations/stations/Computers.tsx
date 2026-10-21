import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../../api/client';
import { listAuditEvents, AuditEvent } from '../../../services/auditService';

export function timestamp(value?: string | null) {
  if (!value) return 'Nunca observado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', timeStyle:'medium' }).format(new Date(value)).replace(', ', ' às ');
}
export function elapsed(value?: string | null) {
  if (!value) return 'Nunca utilizado';
  const seconds = Math.max(0, Math.floor((Date.now()-new Date(value).getTime())/1000));
  const [amount,unit] = seconds>=86400 ? [Math.floor(seconds/86400),'day'] : seconds>=3600 ? [Math.floor(seconds/3600),'hour'] : [Math.floor(seconds/60),'minute'];
  return new Intl.RelativeTimeFormat('pt-BR',{numeric:'auto'}).format(-Number(amount),unit as Intl.RelativeTimeFormatUnit);
}
interface Computer {
  id:number; name:string; sector:string|null; active:boolean; installation_uuid:string;
  system_metadata:{platform:string;arch:string;appVersion:string;electronVersion:string};
  created_at:string; last_login_at:string|null; last_seen_at:string|null;
  last_activity_at:string|null; last_logout_at:string|null; last_username:string|null;
  online:boolean; session_count:number;
}
interface Session {
  id:string; username:string; created_at:string; last_seen_at:string; last_activity_at:string|null;
  ended_at:string|null; end_reason:string|null; expires_at:string|null; state:string;
}
const states:Record<string,string> = {active:'Ativa',closed:'Encerrada',revoked:'Revogada',expired:'Expirada',unconfirmed:'Sem encerramento confirmado'};

export default function Computers() {
  const [rows,setRows] = useState<Computer[]>([]);
  const [selected,setSelected] = useState<Computer|null>(null);
  const [sessions,setSessions] = useState<Session[]>([]);
  const [events,setEvents] = useState<AuditEvent[]>([]);
  const [page,setPage] = useState(1);
  const [historyPage,setHistoryPage] = useState(1);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [name,setName] = useState('');
  const [sector,setSector] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    const response = await apiClient.get<Computer[]>(`devices?page=${page}`);
    if (response.ok) setRows(response.data || []); else setError(response.error || 'Erro ao consultar computadores');
    setBusy(false);
  },[page]);
  useEffect(() => { void load(); },[load]);
  useEffect(() => {
    let cancelled=false;
    if (!selected) return;
    setSessions([]); setEvents([]);
    void Promise.all([
      apiClient.get<Session[]>(`devices/${selected.id}/sessions?page=${historyPage}`),
      listAuditEvents({stationId:String(selected.id),page:historyPage,limit:50}),
    ]).then(([s,e]) => {
      if (cancelled) return;
      if (!s.ok || !e.ok) setError(s.error || e.error || 'Falha ao consultar histórico');
      setSessions(s.data || []); setEvents(e.data?.data || []);
    });
    return () => {cancelled=true;};
  },[selected,historyPage]);
  const change = async (input:object, revoke=false) => {
    if (!selected || busy) return;
    setBusy(true); setError('');
    const response = revoke ? await apiClient.post(`devices/${selected.id}/revoke`) : await apiClient.patch(`devices/${selected.id}`,input);
    if (!response.ok) setError(response.error || 'Falha na alteração');
    else { setSelected({...selected,...response.data}); await load(); }
    setBusy(false);
  };
  return <section className="rounded-xl border bg-white p-4 space-y-3">
    <h2 className="text-xl font-semibold">Computadores e sessões</h2>
    <p className="text-sm">Horários no fuso {Intl.DateTimeFormat().resolvedOptions().timeZone}. Presença indica comunicação, não atividade humana.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button onClick={load} disabled={busy}>Atualizar</button>
    {busy && <p role="status">Carregando…</p>}
    <div className="overflow-auto"><table className="w-full text-sm"><thead><tr>
      {['Computador','Sistema / ERP','Último usuário','Último login','Comunicação','Sem login','Estado'].map(x=><th key={x} className="p-2 text-left">{x}</th>)}
    </tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t">
      <td className="p-2"><button className="text-blue-700" onClick={()=>{setSelected(row);setName(row.name);setSector(row.sector || '');setHistoryPage(1);}}>{row.name}</button></td>
      <td>{row.system_metadata?.platform} / {row.system_metadata?.appVersion}</td><td>{row.last_username || '—'}</td>
      <td>{timestamp(row.last_login_at)}</td><td>{timestamp(row.last_seen_at)}</td><td>{elapsed(row.last_login_at)}</td>
      <td>{!row.active?'Desativado':row.online?'Comunicação recente':'Sem presença confirmada'}</td>
    </tr>)}</tbody></table></div>
    {!busy && !rows.length && <p>Nenhum computador nesta página.</p>}
    <button disabled={page===1 || busy} onClick={()=>setPage(page-1)}>Anterior</button> Página {page} <button disabled={rows.length<50 || busy} onClick={()=>setPage(page+1)}>Próxima</button>
    {selected && <div className="border-t pt-4 space-y-3">
      <h3>{selected.name} — {selected.installation_uuid}</h3>
      <p>Primeira associação: {timestamp(selected.created_at)} · {selected.session_count} sessões</p>
      <p>Última atividade de negócio: {timestamp(selected.last_activity_at)} ({elapsed(selected.last_activity_at)})</p>
      <p>Último logout confirmado: {timestamp(selected.last_logout_at)} ({elapsed(selected.last_logout_at)})</p>
      <p>Sem comunicação: {elapsed(selected.last_seen_at)} · Arquitetura: {selected.system_metadata?.arch} · Electron: {selected.system_metadata?.electronVersion}</p>
      <label>Nome <input className="border p-1" value={name} maxLength={150} onChange={e=>setName(e.target.value)}/></label>
      <label>Setor <input className="border p-1" value={sector} maxLength={120} onChange={e=>setSector(e.target.value)}/></label>
      <button disabled={busy} onClick={()=>change({name,sector})}>Salvar</button>{' '}
      <button disabled={busy} onClick={()=>change({active:!selected.active})}>{selected.active?'Desativar':'Ativar'}</button>{' '}
      <button disabled={busy} onClick={()=>change({},true)}>Revogar sessões</button>
      <h4 className="font-semibold">Sessões</h4>
      {sessions.map(s=><p key={s.id}>{s.username} · {states[s.state]} · Início: {timestamp(s.created_at)} · Comunicação: {timestamp(s.last_seen_at)} · Fim observado: {timestamp(s.ended_at)} · {s.end_reason==='logout' && s.ended_at ? `Duração: ${Math.max(0,Math.floor((Date.parse(s.ended_at)-Date.parse(s.created_at))/1000))} s`:'Duração de uso não confirmada'}</p>)}
      <h4 className="font-semibold">Segurança e acessos</h4>
      {events.filter(e=>!e.module_key || e.module_key==='audit' || e.reauth_outcome==='invalid').map(e=><p key={e.id}>{timestamp(e.created_at)} · {e.username} · {e.action} · {e.outcome} · {e.correlation_id}</p>)}
      <h4 className="font-semibold">Operações de negócio</h4>
      {events.filter(e=>e.module_key && e.module_key!=='audit' && e.reauth_outcome!=='invalid').map(e=><p key={e.id}>{timestamp(e.created_at)} · {e.username} · {e.module_key} / {e.entity_id} · {e.action} · {e.outcome}</p>)}
      <button disabled={historyPage===1} onClick={()=>setHistoryPage(historyPage-1)}>Histórico anterior</button> {historyPage} <button disabled={sessions.length<50 && events.length<50} onClick={()=>setHistoryPage(historyPage+1)}>Próximo histórico</button>
    </div>}
  </section>;
}
