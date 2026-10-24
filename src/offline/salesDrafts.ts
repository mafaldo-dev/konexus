import { apiClient } from '../api/client';
export type DraftScope = { companyId: number; legalEntityId: number; userId: number };
export type DraftPayload = { values: Record<string, any>; products: any[]; selectedCustomer: any; addressConfirmed: boolean; orderNumber: string; editOrderId?: number };
type Envelope = { native: true; value: string } | { native: false; iv: Uint8Array; value: ArrayBuffer };
export type LocalDraft = DraftScope & { key: string; draftId: string; revisionId: string; updatedAt: string; synced: boolean; error?: string; encrypted?: Envelope; storage?: 'sqlite' };
export type StorageStatus = {
  engine: 'sqlite' | 'indexeddb';
  schemaVersion: number;
  pending: number;
  leased: number;
  blocked: number;
  orders?: { pending: number; leased: number; blocked: number; confirmed: number };
  reservations?: { active: number; queued: number; consumed: number; cancelled: number; blocked: number };
};
export const nativeStorage = () => Boolean((window as any).ipcRenderer);
export const nativeCall = async <T,>(method:string,args:Record<string,unknown>):Promise<T> => {
  try{return await (window as any).ipcRenderer.invoke('offline-store',{method,...args});}
  catch(error){
    const message=String(error instanceof Error?error.message:error).replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/,'');
    throw new Error(message);
  }
};
const scopeOf = (row:LocalDraft):DraftScope => ({companyId:row.companyId,legalEntityId:row.legalEntityId,userId:row.userId});
const slotOf = (row:LocalDraft) => row.key.split(':').slice(3).join(':');
let databasePromise: Promise<IDBDatabase> | undefined;
const database = () => databasePromise ||= new Promise<IDBDatabase>((resolve,reject)=>{
  if (typeof indexedDB === 'undefined') { reject(new Error('Armazenamento local indisponível neste ambiente.')); return; }
  const request=indexedDB.open('konexus-offline-v1',1);
  request.onupgradeneeded=()=>{request.result.createObjectStore('drafts',{keyPath:'key'});request.result.createObjectStore('keys');};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(new Error('Feche outras janelas do Konexus para atualizar o armazenamento local.'));
});
export const draftKey=(s:DraftScope,slot='new')=>`${s.companyId}:${s.legalEntityId}:${s.userId}:${slot}`;
async function get<T>(store:string,key:IDBValidKey):Promise<T|undefined>{
  const db=await database();
  return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
async function browserKey():Promise<CryptoKey>{
  const existing=await get<CryptoKey>('keys','aes');if(existing)return existing;
  const candidate=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('keys','readwrite'),store=tx.objectStore('keys'),r=store.get('aes');let key:CryptoKey;
    r.onsuccess=()=>{key=r.result||candidate;if(!r.result)store.put(key,'aes');};
    tx.oncomplete=()=>resolve(key);tx.onerror=()=>reject(tx.error);
  });
}
async function encrypt(payload:DraftPayload,key:string):Promise<Envelope>{
  const text=JSON.stringify(payload);
  if(new TextEncoder().encode(text).byteLength>100000)throw new Error('Rascunho excede 100 KB.');
  const ipc=(window as any).ipcRenderer;
  if(ipc)return {native:true,value:await ipc.invoke('draft-encrypt',JSON.stringify({key,payload}))};
  const iv=crypto.getRandomValues(new Uint8Array(12));
  return {native:false,iv,value:await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(key)},await browserKey(),new TextEncoder().encode(text))};
}
export async function readDraftPayload(row:LocalDraft):Promise<DraftPayload>{
  if(row.storage==='sqlite')return nativeCall('read',{scope:scopeOf(row),slot:slotOf(row),revisionId:row.revisionId});
  const envelope=row.encrypted;
  if(!envelope)throw new Error('Rascunho local sem conteúdo protegido.');
  if(envelope.native){
    const decoded=JSON.parse(await (window as any).ipcRenderer.invoke('draft-decrypt',envelope.value));
    if(decoded.key!==row.key)throw new Error('Rascunho pertence a outro contexto local.');
    return decoded.payload;
  }
  const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:envelope.iv as Uint8Array<ArrayBuffer>,additionalData:new TextEncoder().encode(row.key)},await browserKey(),envelope.value);
  return JSON.parse(new TextDecoder().decode(decoded));
}
const migrations=new Map<string,Promise<void>>();
async function legacyRows():Promise<LocalDraft[]> {
  const db=await database();
  return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
async function migrateToSQLite(scope:DraftScope) {
  const key=draftKey(scope);
  if(!migrations.has(key)){
    const migration=(async()=>{
      const rows=(await legacyRows()).filter(row=>row.companyId===scope.companyId&&row.legalEntityId===scope.legalEntityId&&row.userId===scope.userId);
      for(const row of rows){
        const payload=await readDraftPayload(row);
        await nativeCall('import',{scope,slot:slotOf(row),legacy:{key:row.key,draftId:row.draftId,revisionId:row.revisionId,synced:row.synced},payload});
      }
      // Originais permanecem cifrados no IndexedDB. Marcadores SQLite impedem
      // reimportação e ressurreição após a conclusão do pedido.
    })();
    migrations.set(key,migration);
    migration.catch(()=>migrations.delete(key));
  }
  await migrations.get(key);
}
export async function loadLocalDraft(scope:DraftScope,slot='new'):Promise<LocalDraft|undefined>{
  if(!nativeStorage())return get<LocalDraft>('drafts',draftKey(scope,slot));
  await migrateToSQLite(scope);
  return (await nativeCall<LocalDraft|null>('load',{scope,slot})) || undefined;
}
function changed(){window.dispatchEvent(new Event('konexus:drafts-changed'));}
export async function saveLocalDraft(scope:DraftScope,payload:DraftPayload,expectedRevision:string|null,slot='new'):Promise<LocalDraft>{
  if(nativeStorage()){
    await migrateToSQLite(scope);
    const row=await nativeCall<LocalDraft>('save',{scope,slot,payload,expectedRevision});
    changed();return row;
  }
  const key=draftKey(scope,slot),encrypted=await encrypt(payload,key),db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),r=store.get(key);let row:LocalDraft;
    r.onsuccess=()=>{
      const previous=r.result as LocalDraft|undefined;
      if((previous?.revisionId||null)!==expectedRevision){tx.abort();return;}
      row={...scope,key,draftId:previous?.draftId||crypto.randomUUID(),revisionId:crypto.randomUUID(),updatedAt:new Date().toISOString(),synced:false,encrypted};
      store.put(row);
    };
    tx.oncomplete=()=>{changed();resolve(row);};
    tx.onabort=()=>reject(new Error('Rascunho alterado em outra janela. Recarregue para não sobrescrever os dados.'));
    tx.onerror=()=>reject(tx.error);
  });
}
export async function clearLocalDraft(scope:DraftScope,revisionId:string,slot='new'){
  if(nativeStorage()){
    await migrateToSQLite(scope);
    await nativeCall('clear',{scope,slot,expectedRevision:revisionId});changed();return;
  }
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),r=store.get(draftKey(scope,slot));
    r.onsuccess=()=>{if(r.result?.revisionId===revisionId)store.delete(r.result.key);};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });changed();
}
let syncing=false;
async function syncSQLite(scope:DraftScope){
  await migrateToSQLite(scope);
  for(let count=0;count<20;count++){
    const operations=await nativeCall<Array<{operationId:string;revisionId:string;draftId:string;leaseToken:string;payload:DraftPayload}>>('claim',{scope,limit:1});
    const operation=operations[0];if(!operation)return;
    const {operationId,leaseToken}=operation;
    try {
      const response=await apiClient.put(`sales-drafts/${operation.draftId}`,{owner:scope,revisionId:operation.revisionId,payload:operation.payload},{legalEntityId:scope.legalEntityId,reauth:false});
      const ack=response.data?.data;
      const confirmed=response.ok&&response.data?.success===true&&ack?.draftId===operation.draftId&&ack?.revisionId===operation.revisionId;
      if(confirmed)await nativeCall('ack',{scope,operationId,leaseToken,ack:{draftId:ack.draftId,revisionId:ack.revisionId}});
      else {
        const code=response.status===401?'AUTH':response.status===403?'ACCESS':response.status===409?'CONFLICT':(response.status===0||response.status===408||response.status===429||response.status>=500)?'SERVER':response.ok?'INVALID_ACK':'VALIDATION';
        await nativeCall('reject',{scope,operationId,leaseToken,code});changed();return;
      }
    }catch(error){
      await nativeCall('reject',{scope,operationId,leaseToken,code:'NETWORK'});changed();throw error;
    }
    changed();
  }
}
export async function resumeLocalDrafts(scope:DraftScope){
  if(nativeStorage()){await migrateToSQLite(scope);await nativeCall('resume-auth',{scope});}
}
export async function getLocalStorageStatus(scope:DraftScope):Promise<StorageStatus>{
  if(nativeStorage()){await migrateToSQLite(scope);return nativeCall('stats',{scope});}
  const rows=(await legacyRows()).filter(row=>row.companyId===scope.companyId&&row.legalEntityId===scope.legalEntityId&&row.userId===scope.userId);
  return {engine:'indexeddb',schemaVersion:1,pending:rows.filter(row=>!row.synced).length,leased:0,blocked:0,orders:{pending:0,leased:0,blocked:0,confirmed:0},reservations:{active:0,queued:0,consumed:0,cancelled:0,blocked:0}};
}
export async function backupLocalStorage():Promise<{directory:string;sha256:string;keyProtection:string;schemaVersion?:number}>{
  if(!nativeStorage())throw new Error('Backup SQLite disponível no aplicativo desktop.');
  return (window as any).ipcRenderer.invoke('offline-backup');
}
export async function syncLocalDrafts(scope:DraftScope){
  if(syncing||!navigator.onLine)return;
  syncing=true;
  try {
    if(nativeStorage()){await syncSQLite(scope);return;}
    const db=await database();
    const rows=await new Promise<LocalDraft[]>((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    for(const row of rows.filter(r=>!r.synced&&r.companyId===scope.companyId&&r.userId===scope.userId&&r.legalEntityId===scope.legalEntityId)){
      const payload=await readDraftPayload(row);
      const response=await apiClient.put(`sales-drafts/${row.draftId}`,{owner:scope,revisionId:row.revisionId,payload},{legalEntityId:scope.legalEntityId,reauth:false});
      const acknowledgment=response.data?.data;
      const confirmed=response.ok && response.data?.success===true && acknowledgment?.draftId===row.draftId && acknowledgment?.revisionId===row.revisionId;
      await new Promise<void>((resolve,reject)=>{
        const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),r=store.get(row.key);
        r.onsuccess=()=>{if(r.result?.revisionId===row.revisionId)store.put({...r.result,synced:confirmed,error:confirmed?undefined:response.error||'O servidor não confirmou esta revisão. Sincronização pendente.'});};
        tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
      });changed();
      if(!confirmed)break;
    }
  } finally {syncing=false;}
}
