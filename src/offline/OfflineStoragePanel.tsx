import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../AuthContext';
import {backupLocalStorage,DraftScope,getLocalStorageStatus,nativeStorage,StorageStatus} from './salesDrafts';
import {canReconcileReservation,cancelReservation,listAllServerReservations,listReservations,listServerReservations,reconcileReservation,syncOfflineOrders,StockReservation} from './stockReservations';
import {canReconcileDomainReservation,DOMAIN_RESERVATION_ENDPOINTS,DomainReservation,listAllDomainReservations,reconcileDomainReservation} from './domainReservations';
import Swal from 'sweetalert2';

export default function OfflineStoragePanel({scope}:{scope:DraftScope}){
  const {hasPermission,hasModule}=useAuth();
  const canAdmin=hasPermission('vendas','edit');
  const canFinanceAdmin=hasPermission('finance','edit');
  const canPayrollAdmin=hasPermission('rh','approve_payroll');
  const canAccountingAdmin=hasModule('contabil')&&hasPermission('contabil','manage_periods');
  const canPurchaseAdmin=hasPermission('compras','edit');
  const canCrmAdmin=hasModule('crm')&&hasPermission('crm','edit');
  const canTrainingAdmin=hasPermission('rh','manage_training');
  const [status,setStatus]=useState<StorageStatus|null>(null);
  const [error,setError]=useState(''),[backup,setBackup]=useState(''),[busy,setBusy]=useState(false),[syncing,setSyncing]=useState(false);
  const [orphans,setOrphans]=useState<StockReservation[]>([]),[serverError,setServerError]=useState('');
  const [allReservations,setAllReservations]=useState<StockReservation[]>([]),[adminError,setAdminError]=useState('');
  const [reconciling,setReconciling]=useState<string|null>(null);
  const [domainGroups,setDomainGroups]=useState<Array<{path:string;label:string;items:DomainReservation[]}>>([]);
  const [domainError,setDomainError]=useState(''),[domainBusy,setDomainBusy]=useState<string|null>(null);
  const [domainRefresh,setDomainRefresh]=useState(0);
  useEffect(()=>{
    let live=true;
    const refresh=()=>{void getLocalStorageStatus(scope).then(value=>{if(live){setStatus(value);setError('');}}).catch(e=>{if(live)setError(e.message);});};
    const refreshOrphans=async()=>{
      if(!navigator.onLine||!nativeStorage())return;
      try{
        const [local,server]=await Promise.all([listReservations(scope,100),listServerReservations(scope)]);
        const known=new Set(local.map(reservation=>reservation.id));
        if(live){setOrphans(server.filter(reservation=>!known.has(reservation.id)&&['active','queued','blocked'].includes(reservation.status)));setServerError('');}
      }catch(e){
        const message=e instanceof Error?e.message:String(e);
        if(live&&!/registrad/i.test(message))setServerError(message);
      }
    };
    refresh();void refreshOrphans();
    const draftsChanged=()=>refresh();
    const ordersChanged=()=>void refreshOrphans();
    const backOnline=()=>{refresh();void refreshOrphans();};
    window.addEventListener('konexus:drafts-changed',draftsChanged);
    window.addEventListener('konexus:offline-orders-changed',ordersChanged);
    window.addEventListener('online',backOnline);
    return()=>{live=false;window.removeEventListener('konexus:drafts-changed',draftsChanged);window.removeEventListener('konexus:offline-orders-changed',ordersChanged);window.removeEventListener('online',backOnline);};
  },[scope.companyId,scope.legalEntityId,scope.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    if(!canAdmin){setAllReservations([]);setAdminError('');return;}
    let live=true;
    const refresh=async()=>{
      if(!navigator.onLine)return;
      try{
        const data=await listAllServerReservations(scope);
        if(live){setAllReservations(data);setAdminError('');}
      }catch(e){
        const message=e instanceof Error?e.message:String(e);
        if(live)setAdminError(message);
      }
    };
    void refresh();
    const changed=()=>{void refresh();};
    window.addEventListener('konexus:offline-orders-changed',changed);
    window.addEventListener('online',changed);
    return()=>{live=false;window.removeEventListener('konexus:offline-orders-changed',changed);window.removeEventListener('online',changed);};
  },[scope.companyId,scope.legalEntityId,canAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const entries=[
      ...(canFinanceAdmin?[DOMAIN_RESERVATION_ENDPOINTS.receivable,DOMAIN_RESERVATION_ENDPOINTS.payable]:[]),
      ...(canPayrollAdmin?[DOMAIN_RESERVATION_ENDPOINTS.payroll]:[]),
      ...(canAccountingAdmin?[DOMAIN_RESERVATION_ENDPOINTS.accounting]:[]),
      ...(canPurchaseAdmin?[DOMAIN_RESERVATION_ENDPOINTS.purchase]:[]),
      ...(canCrmAdmin?[DOMAIN_RESERVATION_ENDPOINTS.crm]:[]),
      ...(canTrainingAdmin?[DOMAIN_RESERVATION_ENDPOINTS.training]:[]),
    ];
    if(entries.length===0){setDomainGroups([]);setDomainError('');return;}
    if(!navigator.onLine)return;
    let live=true;
    void Promise.all(entries.map(async entry=>({...entry,items:await listAllDomainReservations(scope,entry.path)})))
      .then(groups=>{if(live){setDomainGroups(groups);setDomainError('');}})
      .catch(e=>{if(live)setDomainError(e instanceof Error?e.message:String(e));});
    return()=>{live=false;};
  },[scope.companyId,scope.legalEntityId,canFinanceAdmin,canPayrollAdmin,canAccountingAdmin,canPurchaseAdmin,canCrmAdmin,canTrainingAdmin,domainRefresh]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const changed=()=>setDomainRefresh(value=>value+1);
    window.addEventListener('konexus:domain-reservations-changed',changed);
    window.addEventListener('online',changed);
    return()=>{window.removeEventListener('konexus:domain-reservations-changed',changed);window.removeEventListener('online',changed);};
  },[]);
  const createBackup=async()=>{
    setBusy(true);setError('');
    try{const result=await backupLocalStorage();setBackup(`${result.directory} — ${result.keyProtection}`);}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível criar backup.');}
    finally{setBusy(false);}
  };
  const cancelOrphan=async(reservation:StockReservation)=>{
    const confirmation=await Swal.fire({
      title:'Liberar reserva sem cópia local?',
      html:`<p>A central reservou ${reservation.items.reduce((sum,item)=>sum+Number(item.quantity),0)} unidade(s) para a estação #${reservation.deviceId}.</p><p class="mt-2 text-sm">Esta cópia local não existe (por exemplo, resposta perdida antes de gravar o token). A liberação exige confirmação de senha e devolve o estoque ao saldo livre.</p>`,
      icon:'warning',showCancelButton:true,confirmButtonText:'Liberar na central',cancelButtonText:'Manter'
    });
    if(!confirmation.isConfirmed)return;
    setBusy(true);setError('');
    try{
      await cancelReservation(scope,reservation.id,'Reserva sem cópia local; reconciliação da estação');
      const [local,current]=await Promise.all([listReservations(scope,100),listServerReservations(scope)]);
      const known=new Set(local.map(item=>item.id));
      setOrphans(current.filter(item=>!known.has(item.id)&&['active','queued','blocked'].includes(item.status)));
      await Swal.fire('Reserva liberada','O estoque voltou ao saldo livre na central.','success');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível liberar a reserva na central.');}
    finally{setBusy(false);}
  };
  const reconcile=async(reservation:StockReservation)=>{
    const quantity=reservation.totalQuantity??reservation.items.reduce((sum,item)=>sum+Number(item.quantity),0);
    const input=await Swal.fire({
      title:'Reconciliar reserva?',
      text:`Reserva ${reservation.id.slice(0,8)}… da estação #${reservation.deviceId} (${reservation.userName||'usuário não identificado'}), com ${quantity} unidade(s). A reconciliação libera o estoque na central e exige confirmação de senha.`,
      input:'textarea',
      inputLabel:'Motivo da reconciliação',
      inputPlaceholder:'Ex.: estação perdida, resposta não recebida, pedido cancelado antes do envio…',
      inputValidator:(value)=>value?.trim().length>=5?undefined:'Informe um motivo com pelo menos 5 caracteres.',
      icon:'warning',showCancelButton:true,confirmButtonText:'Reconciliar',cancelButtonText:'Manter'
    });
    if(!input.isConfirmed)return;
    setReconciling(reservation.id);setError('');
    try{
      await reconcileReservation(scope,reservation.id,String(input.value||''));
      await Swal.fire('Reserva reconciliada','O estoque voltou ao saldo livre na central.','success');
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível reconciliar a reserva na central.');}
    finally{setReconciling(null);}
  };
  const reconcileDomain=async(group:{path:string;label:string},reservation:DomainReservation)=>{
    const input=await Swal.fire({
      title:'Reconciliar reserva?',
      text:`${group.label}: alvo #${reservation.targetId??'—'} da estação #${reservation.deviceId} (${reservation.userName||'usuário não identificado'}). A liberação exige confirmação de senha.`,
      input:'textarea',
      inputLabel:'Motivo da reconciliação',
      inputPlaceholder:'Ex.: estação perdida, resposta não recebida, operação cancelada antes do envio…',
      inputValidator:(value)=>value?.trim().length>=5?undefined:'Informe um motivo com pelo menos 5 caracteres.',
      icon:'warning',showCancelButton:true,confirmButtonText:'Reconciliar',cancelButtonText:'Manter'
    });
    if(!input.isConfirmed)return;
    setDomainBusy(reservation.id);setDomainError('');
    try{
      await reconcileDomainReservation(scope,group.path,reservation.id,String(input.value||''));
      setDomainRefresh(value=>value+1);
      await Swal.fire('Reserva reconciliada','O alvo voltou a ficar disponível na central.','success');
    }catch(e){setDomainError(e instanceof Error?e.message:'Não foi possível reconciliar a reserva na central.');}
    finally{setDomainBusy(null);}
  };
  const syncOrders=async()=>{
    setSyncing(true);setError('');
    try{await syncOfflineOrders(scope);const value=await getLocalStorageStatus(scope);setStatus(value);}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível sincronizar pedidos offline.');}
    finally{setSyncing(false);}
  };
  return <section className="rounded border p-3 text-sm space-y-2" aria-label="Armazenamento offline">
    {status&&<><p><strong>{status.engine==='sqlite'?'SQLite local protegido':'IndexedDB do navegador'}</strong> · schema {status.schemaVersion}</p>
      <p>Rascunhos: {status.pending} pendentes · {status.leased} em envio · {status.blocked} requerem atenção</p>
      {status.orders&&<p>Pedidos offline: {status.orders.pending} aguardando · {status.orders.leased} em envio · {status.orders.blocked} bloqueados · {status.orders.confirmed} confirmados</p>}
      {status.reservations&&<p>Reservas locais: {status.reservations.active} ativas · {status.reservations.queued} em pedido · {status.reservations.blocked} bloqueadas · {status.reservations.consumed} consumidas</p>}
      {status.engine==='sqlite'&&<div className="flex flex-wrap gap-3">
        <button type="button" className="underline" disabled={busy} onClick={createBackup}>{busy?'Criando backup…':'Criar backup local protegido'}</button>
        <button type="button" className="underline" disabled={syncing||!navigator.onLine} onClick={syncOrders}>{syncing?'Sincronizando pedidos…':'Sincronizar pedidos offline'}</button>
      </div>}
    </>}
    {orphans.length>0&&<div className="rounded border border-amber-200 bg-amber-50 p-2">
      <p className="font-medium text-amber-900">Reservas ativas na central sem cópia local</p>
      <p className="text-xs text-amber-800">O estoque está retido. Libere somente após confirmar que não há pedido offline usando estas unidades.</p>
      <ul className="mt-2 space-y-1">
        {orphans.map(reservation=><li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs"><span className="font-mono">{reservation.id.slice(0,8)}…</span> · {reservation.effectiveStatus} · {reservation.items.reduce((sum,item)=>sum+Number(item.quantity),0)} un. · expira {new Date(reservation.expiresAt).toLocaleString('pt-BR')}</span>
          <button type="button" className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700" disabled={busy} onClick={()=>{void cancelOrphan(reservation);}}>Liberar</button>
        </li>)}
      </ul>
    </div>}
    {canAdmin&&<div className="rounded border border-slate-300 bg-slate-50 p-2" aria-label="Administração de reservas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Reservas da organização neste CNPJ</p>
        <button type="button" className="underline text-xs" onClick={()=>window.dispatchEvent(new Event('konexus:offline-orders-changed'))}>Atualizar</button>
      </div>
      <p className="text-xs text-slate-600">Visão de todas as estações. Reconciliar libera o estoque retido na central; exige reautenticação e motivo. Pedidos consumidos ou já cancelados não podem ser reconciliados.</p>
      {!navigator.onLine?<p className="text-xs text-amber-800">Conecte-se à central para consultar e reconciliar reservas.</p>
        :allReservations.length===0?<p className="text-xs">Nenhuma reserva encontrada para este CNPJ.</p>
          :<ul className="mt-2 space-y-1">
            {allReservations.map(reservation=><li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-1">
              <span className="text-xs">
                <span className="font-mono">{reservation.id.slice(0,8)}…</span>
                {' · '}{reservation.userName||'usuário não identificado'}
                {' · '}estação #{reservation.deviceId}{reservation.deviceName?` (${reservation.deviceName})`:''}
                {' · '}{reservation.effectiveStatus}
                {' · '}{reservation.totalQuantity??reservation.items.reduce((sum,item)=>sum+Number(item.quantity),0)} un.
                {' · '}expira {new Date(reservation.expiresAt).toLocaleString('pt-BR')}
                {reservation.orderId?` · pedido #${reservation.orderId}`:''}
              </span>
              {canReconcileReservation(reservation)&&<button type="button" className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900" disabled={reconciling===reservation.id||!navigator.onLine} onClick={()=>{void reconcile(reservation);}}>{reconciling===reservation.id?'Reconciliando…':'Reconciliar'}</button>}
            </li>)}
          </ul>}
      {adminError&&<p role="alert" className="text-amber-800">Administração: {adminError}</p>}
    </div>}
    {(canFinanceAdmin||canPayrollAdmin||canAccountingAdmin||canPurchaseAdmin||canCrmAdmin||canTrainingAdmin)&&<div className="rounded border border-slate-300 bg-slate-50 p-2" aria-label="Reservas por setor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Reservas por setor</p>
        <div className="flex items-center gap-3">
          <Link to="/offline/domains" className="underline text-xs">Abrir continuidade operacional</Link>
          <button type="button" className="underline text-xs" onClick={()=>setDomainRefresh(value=>value+1)}>Atualizar</button>
        </div>
      </div>
      <p className="text-xs text-slate-600">Somente reservas ativas. Reconciliar libera o alvo na central; exige reautenticação e motivo. O consumo ocorre na operação final do título, competência, período ou pedido de compra.</p>
      {!navigator.onLine?<p className="text-xs text-amber-800">Conecte-se à central para consultar e reconciliar reservas.</p>
        :domainGroups.every(group=>group.items.every(item=>item.status!=='active'))?<p className="text-xs">Nenhuma reserva ativa para este CNPJ.</p>
          :domainGroups.map(group=>{
            const items=group.items.filter(item=>item.status==='active');
            if(items.length===0)return null;
            return <div key={group.path} className="mt-2">
              <p className="text-xs font-medium">{group.label}</p>
              <ul className="space-y-1">
                {items.map(reservation=><li key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-1">
                  <span className="text-xs">
                    <span className="font-mono">{reservation.id.slice(0,8)}…</span>
                    {' · '}alvo #{reservation.targetId??'—'}
                    {' · '}{reservation.userName||'usuário não identificado'}
                    {' · '}estação #{reservation.deviceId}{reservation.deviceName?` (${reservation.deviceName})`:''}
                    {' · '}{reservation.effectiveStatus}
                    {' · '}expira {new Date(reservation.expiresAt).toLocaleString('pt-BR')}
                  </span>
                  {canReconcileDomainReservation(reservation)&&<button type="button" className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900" disabled={domainBusy===reservation.id||!navigator.onLine} onClick={()=>{void reconcileDomain(group,reservation);}}>{domainBusy===reservation.id?'Reconciliando…':'Reconciliar'}</button>}
                </li>)}
              </ul>
            </div>;
          })}
      {domainError&&<p role="alert" className="text-amber-800">Reservas: {domainError}</p>}
    </div>}
    {backup&&<p className="break-all">Backup criado: {backup}</p>}
    {serverError&&<p role="alert" className="text-amber-800">Central: {serverError}</p>}
    {error&&<p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
