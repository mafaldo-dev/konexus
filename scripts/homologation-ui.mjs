import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const context = JSON.parse(await readFile(process.env.HOMOLOGATION_CONTEXT || '/tmp/opencode/homologation-context.json','utf8'));
const base = process.env.HOMOLOGATION_WEB || 'http://localhost:3000';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output=process.env.HOMOLOGATION_OUTPUT || '/tmp/opencode/ui';
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],requests=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=500)requests.push({url:r.url(),status:r.status()});});
try {
  await page.goto(base);
  await page.getByPlaceholder('Usuário',{exact:true}).fill(context.username);
  await page.getByPlaceholder('Senha',{exact:true}).fill(context.password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/dashboard',{timeout:30000});
  results.push({route:'/login',status:'Aprovado'});
  const source=await readFile(new URL('../src/routes/AppRoutes.tsx',import.meta.url),'utf8');
  const routes=[...source.matchAll(/path="([^"]+)"/g)].map(m=>m[1])
    .filter(p=>p.startsWith('/')&&!p.includes(':')&&!p.includes('*')&&!p.startsWith('/system-admin')&&p!=='/');
  for(const route of [...new Set(routes)]) {
    const before=errors.length, httpBefore=requests.length;
    await page.goto(base+'/#'+route);
    await page.waitForLoadState('networkidle',{timeout:12000}).catch(()=>{});
    const text=await page.locator('body').innerText();
    const ok=errors.length===before&&requests.length===httpBefore&&text.trim().length>80&&!/Unexpected Application Error|Cannot read properties/.test(text);
    results.push({route,url:page.url(),status:ok?'Aprovado':'Reprovado',pageErrors:errors.slice(before),serverErrors:requests.slice(httpBefore)});
    await page.screenshot({path:output+'/'+route.replace(/[^a-z0-9]/gi,'_')+'.png'});
    console.log(ok?'PASS':'FAIL',route);
  }
} catch(error) {results.push({status:'Reprovado',error:error.message});process.exitCode=1;}
finally {
  await writeFile(output+'/result.json',JSON.stringify({at:new Date().toISOString(),scope:'Login real e navegação de rotas; não substitui testes de escrita em cada tela.',results,errors,requests},null,2));
  if(results.some(r=>r.status==='Reprovado'))process.exitCode=1;
  await browser.close();
}
