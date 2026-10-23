import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { _electron }=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ctx=JSON.parse(await readFile('/tmp/opencode/homologation-context.json','utf8'));
const root=fileURLToPath(new URL('..',import.meta.url));
const app=await _electron.launch({executablePath:root+'/node_modules/electron/dist/electron',args:['--no-sandbox','--ozone-platform=headless','--disable-gpu',root],timeout:30000});
const results=[];
try {
  const page=app.windows().find(w=>!w.url().startsWith('devtools:')) || await app.waitForEvent('window',{predicate:w=>!w.url().startsWith('devtools:')});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.getByPlaceholder('Usuário',{exact:true}).fill(ctx.username);
  await page.getByPlaceholder('Senha',{exact:true}).fill(ctx.password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/dashboard');
  results.push({name:'login',status:'Aprovado'});
  for(const route of ['/manager/products','/financer/financial','/shopping/purchase-requisition','/rh/treinamentos','/rh/folha','/crm']){
    await page.goto('http://localhost:3000/#'+route);
    await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});
    const text=await page.locator('body').innerText();
    if(text.length<80||errors.length)throw new Error(route+': '+errors.join(','));
    results.push({name:route,status:'Aprovado'});
  }
  const runtime=await app.evaluate(({app})=>({version:process.versions.electron,packaged:app.isPackaged}));
  await writeFile('/tmp/opencode/electron-runtime.json',JSON.stringify({runtime,scope:'Linux headless; --no-sandbox somente no harness; sem instalador Windows',results},null,2));
  console.log(runtime,results);
}finally{await app.close();}
