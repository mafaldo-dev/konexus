import {useEffect,useState} from 'react';
import {backupLocalStorage,DraftScope,getLocalStorageStatus,StorageStatus} from './salesDrafts';

export default function OfflineStoragePanel({scope}:{scope:DraftScope}){
  const [status,setStatus]=useState<StorageStatus|null>(null);
  const [error,setError]=useState(''),[backup,setBackup]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    let live=true;
    const refresh=()=>{void getLocalStorageStatus(scope).then(value=>{if(live){setStatus(value);setError('');}}).catch(e=>{if(live)setError(e.message);});};
    refresh();window.addEventListener('konexus:drafts-changed',refresh);
    return()=>{live=false;window.removeEventListener('konexus:drafts-changed',refresh);};
  },[scope.companyId,scope.legalEntityId,scope.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const createBackup=async()=>{
    setBusy(true);setError('');
    try{const result=await backupLocalStorage();setBackup(`${result.directory} — ${result.keyProtection}`);}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível criar backup.');}
    finally{setBusy(false);}
  };
  return <section className="rounded border p-3 text-sm space-y-2" aria-label="Armazenamento offline">
    {status&&<><p><strong>{status.engine==='sqlite'?'SQLite local protegido':'IndexedDB do navegador'}</strong> · schema {status.schemaVersion}</p>
      <p>Pendentes: {status.pending} · em envio: {status.leased} · requerem atenção: {status.blocked}</p>
      {status.engine==='sqlite'&&<button type="button" className="underline" disabled={busy} onClick={createBackup}>{busy?'Criando backup…':'Criar backup local protegido'}</button>}
    </>}
    {backup&&<p className="break-all">Backup criado: {backup}</p>}
    {error&&<p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
