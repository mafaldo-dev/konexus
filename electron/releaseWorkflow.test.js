const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const yaml=require('js-yaml');

test('release só fica pública após build e verificação dos três assets',()=>{
  const workflow=yaml.load(readFileSync(join(__dirname,'../.github/workflows/release.yml'),'utf8'));
  assert.equal(workflow.on.release,undefined,'não executar após publicar uma release vazia');
  const steps=workflow.jobs['build-windows'].steps;
  const prepare=steps.findIndex(s=>s.name==='Preparar a release');
  const build=steps.findIndex(s=>s.name==='Gerar instalador Windows');
  const verify=steps.findIndex(s=>s.name==='Confirmar assets publicados');
  const publish=steps.findIndex(s=>s.name==='Publicar release validada para o autoUpdater');
  const ready=steps.findIndex(s=>s.name==='Confirmar backend compatível antes do autoUpdater');
  assert.ok(prepare>=0 && build>prepare && verify>build && publish>verify);
  assert.ok(ready>verify && ready<publish);
  assert.match(steps[ready].run,/health\.commit -eq \$manifest\.commit/);
  assert.match(steps[prepare].run,/draft = \$true/);
  assert.match(steps[verify].run,/SHA512/);
  assert.match(steps[publish].run,/--draft=false --latest/);
  assert.match(steps.at(-1).run,/audit-update-flow\.mjs --tag/);
});
