const { contextBridge, ipcRenderer } = require('electron');
const receive = new Set(['update_available','download_progress','update_downloaded',
  'update_not_available','update_error','update_checking','update_status',
  'global-shortcut-f1','global-shortcut-f4','network-status','save-excel-error','save-excel-success']);
const send = new Set(['restart_app','check_for_update','download_update','save-excel-file']);
const listeners = new Map();
function removeListener(channel, listener) {
  const group = listeners.get(channel);
  const wrapper = group?.get(listener);
  if (wrapper) { ipcRenderer.removeListener(channel, wrapper); group.delete(listener); }
}
function on(channel, listener) {
  if (!receive.has(channel)) throw new Error('Canal IPC não permitido');
  removeListener(channel, listener);
  const wrapper = (_event, ...args) => listener(null, ...args);
  if (!listeners.has(channel)) listeners.set(channel, new Map());
  listeners.get(channel).set(listener, wrapper);
  ipcRenderer.on(channel, wrapper);
}
contextBridge.exposeInMainWorld('ipcRenderer', {
  on, removeListener,
  send(channel, ...args) {
    if (!send.has(channel)) throw new Error('Canal IPC não permitido');
    ipcRenderer.send(channel, ...args);
  },
  invoke(channel) {
    if (!['get_update_status','get_installation'].includes(channel)) throw new Error('Canal IPC não permitido');
    return ipcRenderer.invoke(channel);
  },
});
