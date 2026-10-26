// Executa somente no Windows, contra o aplicativo realmente instalado pelo NSIS.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const {_electron}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
assert.equal(process.platform,'win32','Este smoke requer Windows nativo.');
const executablePath=process.env.INSTALLED_EXE;
assert.ok(executablePath,'Informe INSTALLED_EXE');
const output=process.env.SMOKE_OUTPUT || 'windows-evidence';
await mkdir(output,{recursive:true});
const results=[];
const sqliteScope={companyId:900001,legalEntityId:900002,userId:900003};
const domainCases = [
  ['financial_receivable', 'settle'], ['financial_payable', 'settle'],
  ['payroll_competency', 'close'], ['accounting_period', 'close'], ['purchase_order', 'approve'],
  ['crm_activity', 'complete'], ['training_enrollment', 'attend'],
  ['purchase_order', 'receive'], ['training_enrollment', 'certificate'],
].map(([domain, action], index) => ({ domain, action, targetId: index + 1, reservationId: randomUUID(), operationId: randomUUID() }));
const returnLocalId=`local:${randomUUID()}`;
const returnOperationId=randomUUID();
async function openApp(previousCipher,previousDraft) {
  const app=await _electron.launch({executablePath,timeout:60000});
  try {
    const page=await app.firstWindow();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.getByPlaceholder('Usuário',{exact:true}).waitFor({timeout:60000});
    await page.getByPlaceholder('Senha',{exact:true}).waitFor();
    const runtime=await app.evaluate(({app})=>({packaged:app.isPackaged,electron:process.versions.electron}));
    assert.equal(runtime.packaged,true);
    assert.match(page.url(),/^file:\/\//);
    const installation=await page.evaluate(()=>window.ipcRenderer.invoke('get_installation'));
    assert.ok(installation);
    const cipher=previousCipher||await page.evaluate(()=>window.ipcRenderer.invoke('draft-encrypt','QA protected offline draft'));
    assert.notEqual(cipher,'QA protected offline draft');
    assert.equal(await page.evaluate(value=>window.ipcRenderer.invoke('draft-decrypt',value),cipher),'QA protected offline draft');
    results.push({name:previousCipher?'Cofre offline recuperado após reinício':'Cofre offline Windows: criptografia e leitura',status:'Aprovado'});
    const stats=await page.evaluate(scope=>window.ipcRenderer.invoke('offline-store',{method:'stats',scope}),sqliteScope);
    assert.equal(stats.engine,'sqlite');
    assert.equal(stats.schemaVersion,8);
    const invoke = request => page.evaluate(request => window.ipcRenderer.invoke('offline-store',request), {scope:sqliteScope,...request});
    for (const item of domainCases) {
      if (!previousDraft) {
        await invoke({method:'save-domain-reservation',domain:item.domain,reservation:{
          id:item.reservationId,domain:item.domain,legalEntityId:sqliteScope.legalEntityId,
          targetId:item.targetId,targetIds:[item.targetId],deviceId:900004,deviceName:'Windows QA',
          userId:sqliteScope.userId,status:'active',expiresAt:new Date(Date.now()+3600000).toISOString(),
          reservationToken:'qa-local-token-not-issued-by-central',
        }});
        await invoke({method:'queue-domain-operation',operation:{...item,payload:item.domain==='financial_payable'?{paymentDate:'2026-10-25'}:{}}});
      } else {
        const operation=await invoke({method:'load-domain-operation',operationId:item.operationId});
        assert.equal(operation.state,'pending');
        assert.equal(operation.domain,item.domain);
      }
    }
    results.push({name:previousDraft?'Nove operações de domínio preservadas após reinício':'Schema v8: nove operações de domínio via IPC',status:'Aprovado',scope:'Fixtures locais; não valida sincronização com a API'});
    if(!previousDraft){
      const payload={purchaseOrderId:99,reason:'Devolução Windows QA',items:[{purchaseOrderItemId:101,quantity:1}]};
      await invoke({method:'save-record',recordType:'purchase_return',record:{localId:returnLocalId,remoteId:null,baseVersion:null,status:'draft',payload}});
      await invoke({method:'queue-record-operation',operation:{operationId:returnOperationId,recordType:'purchase_return',operation:'create',localId:returnLocalId,remoteId:null,baseVersion:null,payload}});
    }else{
      const rows=await invoke({method:'list-records',recordType:'purchase_return'});
      assert.ok(rows.some(row=>row.localId===returnLocalId && row.status==='queued'));
      results.push({name:'Devolução cifrada e enfileirada preservada após reinício',status:'Aprovado'});
    }
    let draft;
    if(!previousDraft){
      draft=await page.evaluate(scope=>window.ipcRenderer.invoke('offline-store',{method:'save',scope,slot:'new',expectedRevision:null,payload:{values:{notes:'SQLite-Windows-persisted-draft'},products:[]}}),sqliteScope);
      assert.equal(draft.storage,'sqlite');
      assert.equal(draft.synced,false);
      results.push({name:'SQLite instalado: gravação local e outbox',status:'Aprovado'});
    }else{
      draft=await page.evaluate(scope=>window.ipcRenderer.invoke('offline-store',{method:'load',scope,slot:'new'}),sqliteScope);
      assert.equal(draft.revisionId,previousDraft.revisionId);
      assert.equal(stats.pending,1);
      const payload=await page.evaluate(input=>window.ipcRenderer.invoke('offline-store',{method:'read',...input}),{scope:sqliteScope,slot:'new',revisionId:draft.revisionId});
      assert.equal(payload.values.notes,'SQLite-Windows-persisted-draft');
      const backup=await page.evaluate(()=>window.ipcRenderer.invoke('offline-backup'));
      assert.match(backup.sha256,/^[0-9a-f]{64}$/);
      const userData=await app.evaluate(({app})=>app.getPath('userData'));
      assert.ok(backup.directory.startsWith(path.join(userData,'offline','backups')));
      const backupBytes=await readFile(path.join(backup.directory,'konexus.sqlite'));
      assert.equal(backupBytes.subarray(0,15).toString(),'SQLite format 3');
      assert.equal(backupBytes.includes(Buffer.from('SQLite-Windows-persisted-draft')),false);
      results.push({name:'SQLite Windows: reinício, fila durável e backup cifrado',status:'Aprovado'});
      await page.evaluate(input=>window.ipcRenderer.invoke('offline-store',{method:'clear',...input}),{scope:sqliteScope,slot:'new',expectedRevision:draft.revisionId});
    }
    assert.equal(errors.length,0,errors.join('\n'));
    await page.screenshot({path:`${output}/launch-${results.length+1}.png`});
    results.push({name:'Inicialização do executável instalado',status:'Aprovado',runtime});
    return {installation,cipher,draft};
  } finally { await app.close(); }
}
try {
  const first=await openApp();
  const second=await openApp(first.cipher,first.draft);
  assert.deepEqual(second.installation,first.installation,'A identidade da instalação deve persistir após reinício.');
  results.push({name:'Persistência da identidade após reinício',status:'Aprovado'});
}catch(error){results.push({status:'Reprovado',error:error.message});process.exitCode=1;}
finally{await writeFile(`${output}/result.json`,JSON.stringify({scope:'Windows NSIS: aplicativo instalado, login renderizado e identidade persistente. Sem autenticação fiscal/produção.',results},null,2));}
