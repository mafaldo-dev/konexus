import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, RefreshCw, Users, Target, CalendarDays } from 'lucide-react';
import Dashboard from '../../components/dashboard/Dashboard';
import { Button } from '../../components/dashboard/components/ui/Button';
import { Card, CardContent } from '../../components/dashboard/components/ui/Card';
import { useAuth } from '../../AuthContext';
import { crmService, CrmMetrics, CrmRecord, CrmResource, CrmStage, CrmHistory } from '../../services/crmService';
import { formatMoney, formatDateTime, inputClass, Modal, Field } from '../Financial/accounting/components';

const labels:Record<CrmResource,string>={leads:'Leads',opportunities:'Oportunidades',activities:'Agenda comercial'};
const initial={name:'',email:'',phone:'',source:'',title:'',amount:'0.00',ownerId:'',customerId:'',leadId:'',stageId:'',expectedCloseDate:'',notes:'',opportunityId:'',kind:'task',dueAt:''};

export default function CrmWorkspace() {
  const {hasPermission,user}=useAuth();
  const [tab,setTab]=useState<CrmResource>('opportunities');
  const [rows,setRows]=useState<CrmRecord[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [stageFilter,setStageFilter]=useState('');
  const [metrics,setMetrics]=useState<CrmMetrics|null>(null);
  const [stages,setStages]=useState<CrmStage[]>([]);
  const [owners,setOwners]=useState<Array<{id:number;username:string}>>([]);
  const [customers,setCustomers]=useState<Array<{id:number;name:string;code:string}>>([]);
  const [customerSearch,setCustomerSearch]=useState('');
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<CrmRecord|null>(null);
  const [form,setForm]=useState(initial);
  const [requestId,setRequestId]=useState('');
  const [historyTarget,setHistoryTarget]=useState<{kind:string;id:number}|null>(null);
  const [historyPage,setHistoryPage]=useState(1);
  const [history,setHistory]=useState<CrmHistory[]>([]);
  const [historyError,setHistoryError]=useState('');
  const loadSequence=useRef({version:0});
  const load=useCallback(async()=>{
    const sequence=++loadSequence.current.version;
    setLoading(true);setError('');
    const [list,dashboard,stageResponse,ownerResponse]=await Promise.all([
      crmService.list(tab,page,query,stageFilter),crmService.metrics(),crmService.stages(),crmService.owners(),
    ]);
    if(sequence!==loadSequence.current.version)return;
    if(!list.ok || !dashboard.ok || !stageResponse.ok || !ownerResponse.ok){
      setError(list.error || dashboard.error || stageResponse.error || ownerResponse.error || 'Não foi possível carregar o CRM.');
      setRows([]);setMetrics(null);
    } else {
      setRows(list.data?.data || []);setTotal(list.data?.total || 0);setMetrics(dashboard.data);
      setStages(stageResponse.data || []);setOwners(ownerResponse.data || []);
    }
    setLoading(false);
  },[tab,page,query,stageFilter]);
  useEffect(()=>{const tracker=loadSequence.current;void load();return()=>{tracker.version++;};},[load]);
  useEffect(()=>{
    if(!historyTarget)return;
    let cancelled=false;setHistory([]);setHistoryError('');
    void crmService.history(historyTarget.kind,historyTarget.id,historyPage).then(result=>{
      if(cancelled)return;
      if(result.ok)setHistory(result.data||[]);else setHistoryError(result.error||'Falha ao carregar histórico.');
    });
    return()=>{cancelled=true;};
  },[historyTarget,historyPage]);
  const showHistory=(row:CrmRecord)=>{setHistoryPage(1);setHistoryTarget({id:row.id,kind:tab==='leads'?'lead':tab==='opportunities'?'opportunity':'activity'});};
  const canCreate=hasPermission('crm','create');
  const canEdit=hasPermission('crm','edit');
  const canArchive=hasPermission('crm','delete');

  const open=(row?:CrmRecord)=>{
    setEditing(row || null);
    setForm({...initial,...(row?{title:row.title||'',name:row.name||'',amount:row.amount||'0.00',notes:row.notes||''}:{}),
      ownerId:String(row?.owner_id || user?.id || ''),stageId:String(row?.stage_id || stages.find(s=>s.outcome==='open')?.id || '')});
    setRequestId(crypto.randomUUID());setModal(true);
  };
  const change=async(row:CrmRecord,input:object,resource:CrmResource=tab)=>{
    if(saving)return;setSaving(true);setError('');
    const result=await crmService.update(resource,row.id,{...input,version:row.version});
    if(!result.ok)setError(result.error || 'Alteração recusada.');
    else await load();
    setSaving(false);
  };
  const move=async(row:CrmRecord,stageId:number)=>{
    if(!canEdit || saving || row.stage_id===stageId)return;
    let lossReason: string|undefined;
    if(stages.find(s=>s.id===stageId)?.outcome==='lost') {
      const answer=await Swal.fire({title:'Motivo da perda',input:'textarea',showCancelButton:true,inputValidator:value=>value.trim()?undefined:'Informe o motivo.'});
      if(!answer.isConfirmed)return;lossReason=answer.value;
    }
    await change(row,{stageId,lossReason},'opportunities');
  };
  const save=async(event:FormEvent)=>{
    event.preventDefault();if(saving)return;setSaving(true);setError('');
    try {
      const input=editing
        ? {version:editing.version,ownerId:Number(form.ownerId),notes:form.notes,...(tab==='leads'?{name:form.name}:{title:form.title,amount:form.amount})}
        : {...form,requestId,ownerId:Number(form.ownerId),stageId:Number(form.stageId),
          customerId:form.customerId?Number(form.customerId):undefined,leadId:form.leadId?Number(form.leadId):undefined,
          opportunityId:form.opportunityId?Number(form.opportunityId):undefined,
          dueAt:form.dueAt?new Date(form.dueAt).toISOString():undefined};
      const result=editing?await crmService.update(tab,editing.id,input):await crmService.create(tab,input);
      if(!result.ok){setError(result.error||'Não foi possível salvar.');return;}
      setModal(false);await load();
    } catch {setError('Verifique os campos e a data informada.');}
    finally{setSaving(false);}
  };
  const archive=async(row:CrmRecord)=>{
    const answer=await Swal.fire({title:'Arquivar registro?',text:'O histórico será preservado.',showCancelButton:true,confirmButtonText:'Arquivar'});
    if(answer.isConfirmed)await change(row,{archived:true});
  };
  const addStage=async()=>{
    const answer=await Swal.fire({title:'Nova etapa',input:'text',showCancelButton:true,inputValidator:value=>value.trim()?undefined:'Informe o nome.'});
    if(!answer.isConfirmed)return;
    const resultType=await Swal.fire({title:'Resultado da etapa',input:'select',inputOptions:{open:'Em andamento',won:'Ganho',lost:'Perdido'},showCancelButton:true});
    if(!resultType.isConfirmed)return;
    let probability=0;
    if(resultType.value==='open') {
      const chance=await Swal.fire({title:'Probabilidade estimada (%)',input:'number',inputValue:0,inputAttributes:{min:'0',max:'100',step:'1'},showCancelButton:true,
        inputValidator:value=>Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=100?undefined:'Informe um inteiro entre 0 e 100.'});
      if(!chance.isConfirmed)return;probability=Number(chance.value);
    }
    setSaving(true);
    const result=await crmService.stage({name:answer.value,position:stages.length,probability,outcome:resultType.value});
    if(!result.ok)setError(result.error||'Falha ao cadastrar etapa.');else await load();
    setSaving(false);
  };
  const field=(key:keyof typeof initial,label:string,type='text',required=false)=><Field label={label}><input aria-label={label} className={inputClass} required={required} type={type}
    value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} step={key==='amount'?'0.01':undefined} min={key==='amount'?'0':undefined}/></Field>;

  return <Dashboard><div className="min-h-screen bg-slate-50/50 px-6 py-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900">Relacionamento com clientes</h1>
      <p className="mt-1 text-slate-600">Leads, oportunidades e atividades persistidos por empresa.</p></div>
      <div className="flex flex-wrap gap-2"><Button onClick={()=>load()} disabled={loading}><RefreshCw size={16}/>Atualizar</Button>
        {canCreate&&<Button onClick={()=>open()} disabled={saving}><Plus size={16}/>Novo registro</Button>}
        <Link className="px-3 py-2 text-blue-700" to="/manager/customer">Cadastro de clientes</Link></div></header>
    {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {metrics&&<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[
      ['Leads novos / qualificados',`${metrics.new_leads} / ${metrics.qualified_leads}`],
      ['Pipeline aberto',formatMoney(metrics.pipeline)],['Previsão ponderada',formatMoney(metrics.weighted)],
      ['Ganho / perdido',`${metrics.won_count} / ${metrics.lost_count}`],
    ].map(([label,value])=><Card key={label}><CardContent className="p-4"><p className="text-sm text-slate-500">{label}</p><strong className="text-xl text-slate-900">{value}</strong></CardContent></Card>)}</div>}
    {metrics&&<p className="text-sm text-slate-600">Conversão dos negócios encerrados: {metrics.win_rate===null?'Sem negócios encerrados':`${metrics.win_rate}%`} · Ticket ganho: {formatMoney(metrics.average_won)} · Atividades vencidas: {metrics.overdue_activities}. Previsão não é receita garantida. Indicadores consideram todos os registros ativos.</p>}
    <nav className="flex flex-wrap gap-2" aria-label="Áreas do CRM">{(['leads','opportunities','activities'] as CrmResource[]).map((item,index)=>{
      const Icon=[Users,Target,CalendarDays][index];return <Button key={item} disabled={saving} variant={tab===item?'default':'outline'} onClick={()=>{setTab(item);setPage(1);setStageFilter('');}}><Icon size={16}/>{labels[item]}</Button>;
    })}</nav>
    <form onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search);}} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">Pesquisar<input disabled={saving} className={inputClass} value={search} onChange={e=>setSearch(e.target.value)} maxLength={150}/></label>
      {tab==='opportunities'&&<label className="text-sm">Etapa<select disabled={saving} className={inputClass} value={stageFilter} onChange={e=>{setStageFilter(e.target.value);setPage(1);}}><option value="">Todas</option>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      <Button type="submit" disabled={loading||saving}>Filtrar</Button>
      {tab==='opportunities'&&hasPermission('crm','configure')&&<Button type="button" onClick={addStage} disabled={saving}>Adicionar etapa</Button>}
    </form>
    {loading?<p role="status">Carregando registros…</p>:tab==='opportunities'?<div className="flex gap-4 overflow-x-auto pb-4" aria-label="Funil comercial">
      {stages.map(stage=><section key={stage.id} className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-3"
        onDragOver={e=>{if(canEdit)e.preventDefault();}} onDrop={e=>{e.preventDefault();const row=rows.find(r=>String(r.id)===e.dataTransfer.getData('text/plain'));if(row)void move(row,stage.id);}}>
        <h2 className="mb-3 font-semibold text-slate-800">{stage.name} <span className="text-sm font-normal">({stage.probability}%)</span></h2>
        {rows.filter(row=>row.stage_id===stage.id).map(row=><article key={row.id} draggable={canEdit&&!saving} onDragStart={e=>e.dataTransfer.setData('text/plain',String(row.id))} className="mb-3 space-y-3 rounded-lg border bg-white p-3 shadow-sm">
          <h3 className="font-medium">{row.title}</h3><p>{formatMoney(row.amount)}</p><p className="text-sm text-slate-500">{owners.find(o=>o.id===row.owner_id)?.username||'Responsável indisponível'}</p>
          {canEdit&&<><label className="text-xs">Mover para<select aria-label={`Etapa de ${row.title}`} className={inputClass} value={row.stage_id} disabled={saving} onChange={e=>void move(row,Number(e.target.value))}>{stages.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className="text-sm text-blue-700" onClick={()=>open(row)}>Editar</button></>}
          {canArchive&&<button disabled={saving} className="ml-3 text-sm text-slate-600" onClick={()=>void archive(row)}>Arquivar</button>}
          <button className="text-sm text-blue-700" onClick={()=>showHistory(row)}>Histórico</button>
        </article>)}
        {!rows.some(row=>row.stage_id===stage.id)&&<p className="text-sm text-slate-500">Nenhum registro nesta página.</p>}
      </section>)}
      {!stages.length&&<p>Configure etapas para iniciar o funil.</p>}
    </div>:<Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Registro</th><th>Responsável</th><th>Situação</th><th>Ações</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id} className="border-t"><td className="p-3">{row.name||row.title}<p className="text-xs text-slate-500">{tab==='activities'?formatDateTime(row.due_at):row.source||'Origem não informada'}</p></td><td>{owners.find(o=>o.id===row.owner_id)?.username||'—'}</td>
        <td>{tab==='activities'?(row.completed_at?'Concluída':'Pendente'):({new:'Novo',qualified:'Qualificado',disqualified:'Desqualificado',converted:'Convertido'}[row.status||'']||row.status)}</td>
        <td className="space-x-3">{canEdit&&tab==='leads'&&row.status!=='converted'&&<><button onClick={()=>open(row)}>Editar</button><button disabled={saving} onClick={()=>void change(row,{status:'qualified'})}>Qualificar</button><button disabled={saving} onClick={()=>void change(row,{status:'disqualified'})}>Desqualificar</button></>}
          <button onClick={()=>showHistory(row)}>Histórico</button>
          {tab==='leads'&&row.status==='qualified'&&canCreate&&<button onClick={()=>{setTab('opportunities');open();setForm({...initial,title:row.name||'',leadId:String(row.id),ownerId:String(row.owner_id),stageId:String(stages.find(s=>s.outcome==='open')?.id||'')});}}>Converter em oportunidade</button>}
          {canArchive&&tab==='leads'&&row.status!=='converted'&&<button disabled={saving} onClick={()=>void archive(row)}>Arquivar</button>}
          {canEdit&&tab==='activities'&&!row.completed_at&&<button disabled={saving} onClick={async()=>{setSaving(true);const result=await crmService.complete(row.id);if(result.ok)await load();else setError(result.error||'Falha ao concluir.');setSaving(false);}}>Concluir</button>}
        </td></tr>)}</tbody></table>{!rows.length&&<p className="p-6 text-slate-500">Nenhum registro encontrado.</p>}</CardContent></Card>}
    <footer className="flex items-center gap-3"><Button disabled={page===1||loading||saving} onClick={()=>setPage(page-1)}>Anterior</Button><span className="text-sm">Página {page} · {total} registros · até 50 por página</span><Button disabled={page*50>=total||loading||saving} onClick={()=>setPage(page+1)}>Próxima</Button></footer>
    <Modal open={modal} title={`${editing?'Editar':'Novo'} — ${labels[tab]}`} onClose={()=>{if(!saving)setModal(false);}}>
      <form onSubmit={save} className="space-y-4">
        {error&&<p role="alert" className="text-red-700">{error}</p>}
        {tab==='leads'?field('name','Nome','text',true):field('title','Título','text',true)}
        <Field label="Responsável"><select className={inputClass} required value={form.ownerId} onChange={e=>setForm({...form,ownerId:e.target.value})}><option value="">Selecione</option>{owners.map(o=><option key={o.id} value={o.id}>{o.username}</option>)}</select></Field>
        {tab==='leads'&&!editing&&<div className="grid gap-4 md:grid-cols-2">{field('email','E-mail','email')}{field('phone','Telefone')}{field('source','Origem')}</div>}
        {tab==='opportunities'&&<>{field('amount','Valor estimado (R$)','number',true)}{!editing&&<>
          {form.leadId?<p>Conversão do lead #{form.leadId}; seu histórico será preservado.</p>:<>
            <Field label="Pesquisar cliente existente"><div className="flex gap-2"><input className={inputClass} value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/><Button type="button" onClick={async()=>{const result=await crmService.customers(customerSearch);if(result.ok)setCustomers(result.data||[]);else setError(result.error||'Falha ao buscar clientes.');}}>Buscar</Button></div></Field>
            <Field label="Cliente"><select required className={inputClass} value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}><option value="">Selecione</option>{customers.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select></Field></>}
          <Field label="Etapa inicial"><select required className={inputClass} value={form.stageId} onChange={e=>setForm({...form,stageId:e.target.value})}>{stages.filter(s=>s.outcome==='open').map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          {field('expectedCloseDate','Previsão de fechamento','date')}
        </>}</>}
        {tab==='activities'&&<>{field('opportunityId','Número da oportunidade','number',true)}{field('dueAt','Data e hora local','datetime-local',true)}<Field label="Tipo"><select className={inputClass} value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}>{Object.entries({task:'Tarefa',call:'Ligação',meeting:'Reunião',visit:'Visita',follow_up:'Retorno',note:'Anotação'}).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field></>}
        {tab!=='activities'&&field('notes','Observações')}
        <div className="flex justify-end gap-2"><Button type="button" onClick={()=>setModal(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving?'Salvando…':'Salvar'}</Button></div>
      </form>
    </Modal>
    <Modal open={Boolean(historyTarget)} title="Histórico do registro" onClose={()=>setHistoryTarget(null)}>
      {historyError&&<p role="alert" className="text-red-700">{historyError}</p>}
      {history.map(event=><article key={event.id} className="border-b py-3"><p>{formatDateTime(event.created_at)} · {event.username} · {event.action} · {event.outcome}</p>
        {Object.entries(event.changes||{}).map(([key,value])=><p className="text-sm text-slate-600" key={key}>{key}: {String(value.from??'—')} → {String(value.to??'—')}</p>)}</article>)}
      {!history.length&&!historyError&&<p>Nenhum evento carregado nesta página.</p>}
      <div className="mt-4 flex items-center gap-2"><Button disabled={historyPage===1} onClick={()=>setHistoryPage(historyPage-1)}>Anterior</Button>{historyPage}<Button disabled={history.length<50} onClick={()=>setHistoryPage(historyPage+1)}>Próxima</Button></div>
    </Modal>
  </div></div></Dashboard>;
}
