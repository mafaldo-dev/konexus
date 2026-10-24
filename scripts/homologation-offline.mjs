import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const ctx=JSON.parse(await readFile('/tmp/opencode/homologation-context.json','utf8'));
const browser=await chromium.launch();
const context=await browser.newContext();
const page=await context.newPage();
const results=[];
const note='QA offline '+Date.now();
const check=(name,ok)=>{assert.ok(ok,name);results.push({name,status:'Aprovado'});};
try {
  await page.goto('http://localhost:3000');
  await page.getByPlaceholder('Usuário',{exact:true}).fill(ctx.username);
  await page.getByPlaceholder('Senha',{exact:true}).fill(ctx.password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/dashboard');
  await page.goto('http://localhost:3000/#/sales/newOrder');
  await page.getByText(/Salvamento local automático ativo|Salvo neste dispositivo|Salvo localmente/).first().waitFor();
  // API indisponível; arquivos da aplicação continuam locais/acessíveis.
  await context.route('http://localhost:3010/**',route=>route.abort('internetdisconnected'));
  await page.locator('[name="notes"]').fill(note);
  await page.getByText(/Salvo neste dispositivo|Salvo localmente/).first().waitFor();
  await page.goto('http://localhost:3000/#/offline');
  await page.getByLabel('Observações',{exact:true}).waitFor();
  check('recupera rascunho durante queda',await page.getByLabel('Observações',{exact:true}).inputValue()===note);
  await page.reload();
  await page.getByLabel('Observações',{exact:true}).waitFor({timeout:45000});
  check('recupera após reinício da interface com API indisponível',await page.getByLabel('Observações',{exact:true}).inputValue()===note);
  const second=await context.newPage();
  await second.goto('http://localhost:3000/#/offline');
  await second.getByLabel('Observações',{exact:true}).waitFor();
  await page.getByLabel('Observações',{exact:true}).fill(note+' revisado');
  await page.getByText('Salvo localmente; aguardando confirmação do banco online').waitFor();
  await second.getByLabel('Observações',{exact:true}).fill('Edição concorrente não deve sobrescrever');
  await second.getByText('Rascunho alterado em outra janela. Recarregue para não sobrescrever os dados.').waitFor();
  check('conflito entre janelas preserva versão gravada',true);
  await second.close();
  await context.unroute('http://localhost:3010/**');
  const rejectedAck=page.waitForResponse(r=>r.url().includes('/sales-drafts/')&&r.request().method()==='PUT');
  await context.route('http://localhost:3010/sales-drafts/*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:{draftId:'wrong',revisionId:'wrong'}})}));
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await rejectedAck;
  await page.waitForFunction(()=>new Promise(resolve=>{
    const r=indexedDB.open('konexus-offline-v1');r.onsuccess=()=>{
      const q=r.result.transaction('drafts').objectStore('drafts').getAll();
      q.onsuccess=()=>resolve(q.result.some(x=>!x.synced&&x.error?.includes('não confirmou')));
    };
  }));
  check('HTTP 200 sem confirmação da revisão não marca sincronizado',true);
  await context.unroute('http://localhost:3010/sales-drafts/*');
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.getByText('Rascunho sincronizado com o banco online. Entre no sistema para revisar e finalizar.').waitFor({timeout:45000});
  const remote=await page.evaluate(async entityId=>{
    const r=await fetch('http://localhost:3010/sales-drafts',{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`,'X-Legal-Entity-Id':String(entityId)}});
    return r.json();
  },ctx.legalEntityId);
  check('reconexão grava revisão no PostgreSQL',remote.data.some(row=>row.payload.values.notes===note+' revisado'));
  const encrypted=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const r=indexedDB.open('konexus-offline-v1');r.onerror=()=>reject(r.error);
    r.onsuccess=()=>{const q=r.result.transaction('drafts').objectStore('drafts').getAll();q.onsuccess=()=>resolve(q.result.every(x=>!('payload' in x)&&!!x.encrypted));};
  }));
  check('IndexedDB não armazena formulário em texto aberto',encrypted);
}catch(error){results.push({status:'Reprovado',error:error.message});console.error(error,await page.locator('body').innerText());await page.screenshot({path:'/tmp/opencode/offline-error.png'});process.exitCode=1;}
finally{await writeFile('/tmp/opencode/offline-ui.json',JSON.stringify({scope:'Rascunho de vendas e reconexão, não homologação offline de todos os módulos.',results},null,2));await browser.close();}
