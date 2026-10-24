import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../api/client';
import {DraftPayload,DraftScope,LocalDraft,loadLocalDraft,readDraftPayload,saveLocalDraft,syncLocalDrafts,resumeLocalDrafts} from './salesDrafts';
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
  useEffect(()=>{
    if(!scope){setStatus('Entre online ao menos uma vez neste perfil para recuperar seus rascunhos.');return;}
    let alive=true;
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
      if(token!==resumedToken){await resumeLocalDrafts(scope);resumedToken=token;}
      await syncLocalDrafts(scope);
      const current=await loadLocalDraft(scope);
      if(alive&&current?.synced)setStatus('Rascunho sincronizado com o banco online. Entre no sistema para revisar e finalizar.');
    };
    const retry=()=>{void sync().catch(()=>{});};
    const timer=setInterval(retry,15000);window.addEventListener('online',retry);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener('online',retry);};
  },[scope]);
  const save=(next:DraftPayload)=>{
    if(!scope)return;setPayload(next);
    chain.current=chain.current.catch(()=>{}).then(async()=>{
      row.current=await saveLocalDraft(scope,next,row.current?.revisionId||null);
      setStatus('Salvo localmente; aguardando confirmação do banco online');
    }).catch(error=>{setStatus(error.message);});
  };
  return <main className="mx-auto max-w-4xl p-6 space-y-4">
    <h1 className="text-2xl font-bold">Área de continuidade offline</h1>
    <p>Somente rascunhos locais. Estoque, financeiro, autorização e emissão fiscal continuam dependendo da validação online.</p>
    <p role="status" className="rounded bg-blue-50 p-3">{status}</p>
    {scope&&<p>Organização #{scope.companyId} · CNPJ interno #{scope.legalEntityId} · usuário #{scope.userId}</p>}
    {scope&&<OfflineStoragePanel scope={scope}/>}
    {payload&&<section className="space-y-4">
      <p>Cliente: {payload.selectedCustomer?.name||'Ainda não selecionado'}</p>
      {['salesperson','carrier','notes'].map(name=><label key={name} className="block">{name==='notes'?'Observações':name==='carrier'?'Transportadora':'Vendedor'}
        <textarea aria-label={name==='notes'?'Observações':name==='carrier'?'Transportadora':'Vendedor'} className="block w-full border p-2" value={payload.values[name]||''} onChange={e=>save({...payload,values:{...payload.values,[name]:e.target.value}})}/>
      </label>)}
      {payload.products.map((product,index)=><label className="block" key={product.id}>{product.name||product.productname} — quantidade
        <input className="ml-3 border p-2" type="number" min="1" step="1" value={product.quantity} onChange={e=>{
          const quantity=Number(e.target.value);if(!Number.isSafeInteger(quantity)||quantity<1)return;
          save({...payload,products:payload.products.map((p,i)=>i===index?{...p,quantity,total_price:quantity*p.price}:p)});
        }}/>
      </label>)}
    </section>}
    <Link className="inline-block underline" to="/">Voltar ao login / revisão online</Link>
  </main>;
}
