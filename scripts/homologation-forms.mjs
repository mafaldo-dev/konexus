import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ctx=JSON.parse(await readFile('/tmp/opencode/homologation-context.json','utf8'));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const results=[];
const run=Date.now().toString();
const fill=async values=>{for(const [name,value] of Object.entries(values))await page.locator(`input[name="${name}"],textarea[name="${name}"]`).fill(String(value));};
async function submit(endpoint) {
  const response=page.waitForResponse(r=>r.url().endsWith(endpoint)&&r.request().method()==='POST'&&r.status()!==403);
  await page.locator('button[type=submit]').last().click();
  const confirmation=page.locator('#reauth-password');
  if(await confirmation.waitFor({state:'visible',timeout:10000}).then(()=>true).catch(()=>false)) {
    await confirmation.fill(ctx.password);
    await page.getByRole('button',{name:/Confirmar/}).last().click();
  }
  const r=await response;
  const body=await r.json();
  assert.equal(r.status(),201,JSON.stringify(body));
  await page.locator('.swal2-confirm').click({timeout:2000}).catch(()=>{});
  results.push({endpoint,status:'Aprovado',response:body});
  console.log('PASS',endpoint);
}
try {
  await page.goto('http://localhost:3000');
  await page.getByPlaceholder('Usuário',{exact:true}).fill(ctx.username);
  await page.getByPlaceholder('Senha',{exact:true}).fill(ctx.password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/dashboard');
  await page.goto('http://localhost:3000/#/manager/suppliers');
  await page.getByRole('button',{name:'+',exact:true}).click();
  await fill({code:'UIF'+run,national_register_code:'11222333000181',name:'Fornecedor UI '+run,trading_name:'Fornecedor UI',email:'ui@example.test',phone:'11999990001'});
  await submit('/suppliers/create');
  await page.goto('http://localhost:3000/#/manager/customer');
  await page.locator('button').filter({has:page.locator('svg.lucide-plus')}).click();
  await fill({name:'Cliente UI '+run,cpf_cnpj:'52998224725',code:'UIC'+run,phone:'11999990002',email:'ui@example.test','address.zip':'01001000','address.city_code':'3550308','address.neighborhood':'Centro','address.city':'São Paulo','address.street':'Rua QA','address.number':'123'});
  await page.locator('[name="address.state"]').selectOption('SP');
  await submit('/customers/create');
  await page.goto('http://localhost:3000/#/manager/products');
  await page.getByRole('button',{name:'+',exact:true}).click();
  await fill({name:'Produto UI '+run,code:'UIP'+run,brand:'QA',category:'QA',stock:0,minimum_stock:1,location:'A1',price:100,coast:50,description:'Cadastro pela interface na homologação'});
  await page.locator('[name=supplier_id]').selectOption(String(results[0].response.supplier.id));
  await page.getByRole('button',{name:'Dados Fiscais',exact:true}).click();
  await fill({ncm:'84713012',cfop:'5102'});
  await page.locator('[name=unidade]').selectOption('UN');
  await page.locator('[name=origem]').selectOption('0');
  await submit('/products/create');
}catch(error){console.error(error);results.push({status:'Reprovado',error:error.message});process.exitCode=1;}
finally{await page.screenshot({path:'/tmp/opencode/forms.png'});await writeFile('/tmp/opencode/forms.json',JSON.stringify(results,null,2));await browser.close();}
