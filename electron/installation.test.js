const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { loadInstallation } = require('./installation');

test('identidade persiste entre execuções/versões e instalações são distintas', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'konexus-installation-'));
  try {
    const first = loadInstallation(path.join(root,'a'));
    assert.deepEqual(loadInstallation(path.join(root,'a')),first);
    assert.notEqual(loadInstallation(path.join(root,'b')).id,first.id);
    assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(root,'a','installation.json')))),['id']);
    fs.writeFileSync(path.join(root,'a','installation.json'),'corrompido');
    assert.throws(()=>loadInstallation(path.join(root,'a')));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('preload limita canais, remove listeners e não expõe evento privilegiado', () => {
  let bridge;
  const listeners = new Map();
  const ipc = { on:(c,f)=>listeners.set(c,f), removeListener:(c)=>listeners.delete(c),
    send:()=>{}, invoke:async()=>({id:'test'}) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'preload.js'),'utf8'), {
    require:()=>({ipcRenderer:ipc,contextBridge:{exposeInMainWorld:(_name,value)=>{bridge=value;}}}),
  });
  assert.throws(()=>bridge.send('arbitrary-shell'));
  assert.throws(()=>bridge.invoke('read-file','/etc/passwd'));
  let received;
  const listener=(event,value)=>{received={event,value};};
  bridge.on('update_status',listener);
  listeners.get('update_status')({sender:'privileged'},'downloaded');
  assert.deepEqual(received,{event:null,value:'downloaded'});
  bridge.removeListener('update_status',listener);
  assert.equal(listeners.size,0);
});
