import {useEffect,useState} from 'react';
import {backupLocalStorage,DraftScope,getLocalStorageStatus,nativeStorage,StorageStatus} from './salesDrafts';
import {cancelReservation,listReservations,listServerReservations,syncOfflineOrders,StockReservation} from './stockReservations';
import Swal from 'sweetalert2';

export default function OfflineStoragePanel({scope}:{scope:DraftScope}){
  const [status,setStatus]=useState<StorageStatus|null>(null);
  const [error,setError]=useState(''),[backup,setBackup]=useState(''),[busy,setBusy]=useState(false),[syncing,setSyncing]=useState(false);
  const [orphans,setOrphans]=useState<StockReservation[]>([]),[serverError,setServerError]=useState('');
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
    {backup&&<p className="break-all">Backup criado: {backup}</p>}
    {serverError&&<p role="alert" className="text-amber-800">Central: {serverError}</p>}
    {error&&<p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
