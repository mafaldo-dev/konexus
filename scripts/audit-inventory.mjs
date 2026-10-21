// Inventário estático reprodutível. Não acessa APIs nem o banco configurado.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const backend=resolve(root,'../konexus-back');
const {matchProtectedOperation,matchExemptRoute}=await import(`${backend}/src/http/routes/protectedOperations.js`);
const routesRoot=resolve(backend,'src/http/routes');
const index=await readFile(resolve(routesRoot,'index.js'),'utf8');
const imports=new Map([...index.matchAll(/import\s+(\w+Routes)\s+from\s+["']\.\/([^"']+)["']/g)].map(m=>[m[1],m[2]]));
const mounts=[...index.matchAll(/router\.use\(["']([^"']+)["'],\s*(\w+Routes)\(/g)];
const output=['# Inventário estático de rotas e entidades','',
  'Gerado por `node scripts/audit-inventory.mjs`. Cobertura da matriz não comprova execução HTTP, autorização ou persistência.',
  'Testes HTTP/PostgreSQL cobrem login, logout, computadores, CRM e reautenticação; há também teste SQL de baixa financeira concorrente (ver relatórios). Demais linhas exigem validação por operação.',
  '', '| Método | Rota API | Módulo / operação | Reautenticação | Fonte |', '|---|---|---|---|---|'];
let count=0;
for (const mount of mounts) {
  const file=imports.get(mount[2]);
  if (!file) throw new Error(`Import não resolvido: ${mount[2]}`);
  const text=await readFile(resolve(routesRoot,file),'utf8');
  for (const route of text.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)) {
    const method=route[1].toUpperCase();
    const path=`${mount[1]}${route[2]}`.replace(/\/$/,'');
    const sample=path.replace(/:\w+/g,'1');
    const operation=matchProtectedOperation(method,sample);
    const exemption=matchExemptRoute(method,sample);
    const line=text.slice(0,route.index).split('\n').length;
    output.push(`| ${method} | \`${path}\` | ${operation?.id || (method==='GET'?'Leitura':exemption?'Sessão':'SEM MATRIZ')} | ${operation?.reauth?'Sim':exemption?'Isenta justificada':'Não / leitura'} | ${file}:${line} |`);
    count++;
  }
}
output.push('',`Total: ${count} rotas literais detectadas. Rotas dinâmicas/Socket.IO não são cobertas pelo extrator.`,'','## Rotas da interface','');
const app=await readFile(resolve(root,'src/routes/AppRoutes.tsx'),'utf8');
for (const m of app.matchAll(/path=["']([^"']+)["']/g)) output.push(`- \`${m[1]}\``);
output.push('','## Entidades referenciadas em SQL (candidatas, não esquema introspectado)','');
const entities=new Map();
for (const file of await readdir(resolve(backend,'src/domain/repositories'))) {
  if (!file.endsWith('.js')) continue;
  const text=await readFile(resolve(backend,'src/domain/repositories',file),'utf8');
  for (const m of text.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z][a-zA-Z_0-9]*)/g)) {
    const name=m[1].toLowerCase();
    if (['set','select','of','the','e','na','delete'].includes(name)) continue;
    if (!entities.has(name)) entities.set(name,new Set());
    entities.get(name).add(file);
  }
}
for (const [entity,files] of [...entities].sort()) output.push(`- \`${entity}\`: ${[...files].join(', ')}`);
await writeFile(resolve(root,'docs/MATRIZ_ROTAS_2026.md'),output.join('\n')+'\n');
console.log(`Inventário gerado: ${count} rotas API, ${entities.size} candidatos SQL.`);
