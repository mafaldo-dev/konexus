import { apiClient } from '../api/client';
export type DraftScope = { companyId: number; legalEntityId: number; userId: number };
export type DraftPayload = { values: Record<string, any>; products: any[]; selectedCustomer: any; addressConfirmed: boolean; orderNumber: string; editOrderId?: number };
type Envelope = { native: true; value: string } | { native: false; iv: Uint8Array; value: ArrayBuffer };
export type LocalDraft = DraftScope & { key: string; draftId: string; revisionId: string; updatedAt: string; synced: boolean; error?: string; encrypted: Envelope };
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
  const envelope=row.encrypted;
  if(envelope.native){
    const decoded=JSON.parse(await (window as any).ipcRenderer.invoke('draft-decrypt',envelope.value));
    if(decoded.key!==row.key)throw new Error('Rascunho pertence a outro contexto local.');
    return decoded.payload;
  }
  const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:envelope.iv as Uint8Array<ArrayBuffer>,additionalData:new TextEncoder().encode(row.key)},await browserKey(),envelope.value);
  return JSON.parse(new TextDecoder().decode(decoded));
}
export const loadLocalDraft=(scope:DraftScope,slot='new')=>get<LocalDraft>('drafts',draftKey(scope,slot));
function changed(){window.dispatchEvent(new Event('konexus:drafts-changed'));}
export async function saveLocalDraft(scope:DraftScope,payload:DraftPayload,expectedRevision:string|null,slot='new'):Promise<LocalDraft>{
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
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),r=store.get(draftKey(scope,slot));
    r.onsuccess=()=>{if(r.result?.revisionId===revisionId)store.delete(r.result.key);};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });changed();
}
let syncing=false;
export async function syncLocalDrafts(scope:DraftScope){
  if(syncing||!navigator.onLine)return;
  syncing=true;
  try {
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
