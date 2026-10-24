import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../api/client';
import {DraftPayload,DraftScope,LocalDraft,loadLocalDraft,readDraftPayload,saveLocalDraft,syncLocalDrafts,resumeLocalDrafts} from './salesDrafts';
import {listOfflineOrders,listReservations,resumeOfflineOrders,OfflineOrder,StockReservation,syncOfflineOrders} from './stockReservations';
import OfflineStoragePanel from './OfflineStoragePanel';

// Acesso somente à cópia local do último perfil. Não restaura permissões
// online pelo cache: toda sincronização revalida a sessão no servidor.
export default function OfflineWorkspace(){
  const [scope]=useState<DraftScope|null>(()=>{
    try {
      const user=JSON.parse(localStorage.getItem('userData')||'null');
      const company=JSON.parse(localStorage.getItem('companyData')||'null');
      const entity=JSON.parse(localStorage.getItem('activeLegalEntity')||'null');
      return user?.id&&company?.id&&entity?.id&&localStorage.getItem('token')?{companyId:Number(company.id),legalEntityId:Number(entity.id),userId:Number(user.id)}:null;
    } catch{return null;}
  });
  const row=useRef<LocalDraft|undefined>(undefined),chain=useRef<Promise<any>>(Promise.resolve());
  const [payload,setPayload]=useState<DraftPayload|null>(null);
  const [status,setStatus]=useState('Abrindo rascunho local…');
  const [reservations,setReservations]=useState<StockReservation[]>([]);
  const [orders,setOrders]=useState<OfflineOrder[]>([]);
  // O rascunho 'new' nao pode ser alterado depois que uma reserva ou um
  // pedido imutavel foi criado: uma nova revisao sobreviveria ao ACK exato e
  // poderia ser reenviada como um segundo pedido.
  const locked=Boolean(
    reservations.some(reservation=>reservation.slot==='new'&&['active','queued','blocked'].includes(reservation.status)) ||
    orders.some(order=>order.slot==='new'&&['pending','leased','blocked'].includes(order.state))
  );
  const lockedRef=useRef(locked);
  lockedRef.current=locked;
  useEffect(()=>{
    if(!scope){setStatus('Entre online ao menos uma vez neste perfil para recuperar seus rascunhos.');return;}
    let alive=true;
    const refreshLocal=async()=>{
      const [nextReservations,nextOrders]=await Promise.all([listReservations(scope),listOfflineOrders(scope)]);
      if(alive){setReservations(nextReservations);setOrders(nextOrders);}
    };
    void refreshLocal().catch(()=>{});
    loadLocalDraft(scope).then(async value=>{
      if(!value){if(alive)setStatus('Nenhum rascunho de novo pedido neste usuário/CNPJ.');return;}
      const data=await readDraftPayload(value);if(!alive)return;
      row.current=value;setPayload(data);setStatus(value.synced?'Cópia local sincronizada':'Recuperado localmente; sincronização pendente');
    }).catch(error=>setStatus(error.message));
    let resumedToken:string|null=null;
    const sync=async()=>{
      if(!navigator.onLine)return;
      await chain.current.catch(()=>{});
      const session=await apiClient.get('login/session',{reauth:false});
      if(!session.ok||Number(session.data?.user?.id)!==scope.userId)return;
      const token=localStorage.getItem('token');
      if(token!==resumedToken){await resumeLocalDrafts(scope);await resumeOfflineOrders(scope);resumedToken=token;}
      await syncLocalDrafts(scope);
      await syncOfflineOrders(scope);
      await refreshLocal();
      const current=await loadLocalDraft(scope);
      if(alive&&current?.synced)setStatus('Rascunho sincronizado com o banco online. Entre no sistema para revisar e finalizar.');
    };
    const retry=()=>{void sync().catch(()=>{});};
    const refresh=()=>{void refreshLocal().catch(()=>{});};
    const timer=setInterval(retry,15000);window.addEventListener('online',retry);
    window.addEventListener('konexus:offline-orders-changed',refresh);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('konexus:offline-orders-changed',refresh);};
  },[scope]);
  const save=(next:DraftPayload)=>{
    if(!scope||locked)return;setPayload(next);
    chain.current=chain.current.catch(()=>{}).then(async()=>{
      if(lockedRef.current)return;
      row.current=await saveLocalDraft(scope,next,row.current?.revisionId||null);
      setStatus('Salvo localmente; aguardando confirmação do banco online');
    }).catch(error=>{setStatus(error.message);});
  };
  return <main className="mx-auto max-w-4xl p-6 space-y-4">
    <h1 className="text-2xl font-bold">Área de continuidade offline</h1>
    <p>Rascunhos, reservas de estoque e pedidos aguardando confirmação neste dispositivo. Estoque livre, autorização e emissão fiscal continuam dependendo da validação online.</p>
    <p className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
      Financeiro, folha e contábil têm uma área própria de reservas e operações offline.
      {' '}<Link className="font-medium underline" to="/offline/domains">Abrir continuidade de domínios</Link>.
    </p>
    <p role="status" className="rounded bg-blue-50 p-3">{status}</p>
    {scope&&<p>Organização #{scope.companyId} · CNPJ interno #{scope.legalEntityId} · usuário #{scope.userId}</p>}
    {scope&&<OfflineStoragePanel scope={scope}/>}
    {scope&&reservations.length>0&&<section className="rounded border p-3 text-sm">
      <h2 className="font-semibold">Reservas de estoque deste perfil</h2>
      <ul className="mt-2 space-y-1">
        {reservations.map(reservation=><li key={reservation.id}>
          <span className="font-mono">{reservation.id.slice(0,8)}…</span> · {reservation.status} · {reservation.items.length} item(ns) · expira {new Date(reservation.expiresAt).toLocaleString('pt-BR')}
        </li>)}
      </ul>
    </section>}
    {scope&&orders.length>0&&<section className="rounded border p-3 text-sm">
      <h2 className="font-semibold">Pedidos offline</h2>
      <ul className="mt-2 space-y-1">
        {orders.map(order=><li key={order.operationId}>
          <span className="font-mono">{order.operationId.slice(0,8)}…</span> · {order.state}
          {order.serverOrderNumber?` · ${order.serverOrderNumber}`:''}
          {order.errorCode?` · ${order.errorCode}`:''}
        </li>)}
      </ul>
      <p className="mt-2 text-xs">Pedidos bloqueados exigem revisão da reserva no formulário do pedido. Nenhum conteúdo é descartado automaticamente.</p>
    </section>}
    {payload&&<section className="space-y-4">
      {locked&&<p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Os itens e o pedido estão travados por uma reserva de estoque ou por um pedido aguardando confirmação.
        Abra o formulário do pedido para sincronizar, tentar novamente ou liberar a reserva; editar aqui criaria uma revisão paralela.
        {' '}<Link className="underline" to="/sales/newOrder">Abrir formulário do pedido</Link>
      </p>}
      <p>Cliente: {payload.selectedCustomer?.name||'Ainda não selecionado'}</p>
      {['salesperson','carrier','notes'].map(name=><label key={name} className="block">{name==='notes'?'Observações':name==='carrier'?'Transportadora':'Vendedor'}
        <textarea aria-label={name==='notes'?'Observações':name==='carrier'?'Transportadora':'Vendedor'} disabled={locked} className="block w-full border p-2 disabled:bg-gray-100" value={payload.values[name]||''} onChange={e=>save({...payload,values:{...payload.values,[name]:e.target.value}})}/>
      </label>)}
      {payload.products.map((product,index)=><label className="block" key={product.id}>{product.name||product.productname} — quantidade
        <input className="ml-3 border p-2 disabled:bg-gray-100" disabled={locked} type="number" min="1" step="1" value={product.quantity} onChange={e=>{
          const quantity=Number(e.target.value);if(!Number.isSafeInteger(quantity)||quantity<1)return;
          save({...payload,products:payload.products.map((p,i)=>i===index?{...p,quantity,total_price:quantity*p.price}:p)});
        }}/>
      </label>)}
    </section>}
    <Link className="inline-block underline" to="/">Voltar ao login / revisão online</Link>
  </main>;
}
