const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function loadInstallation(userData) {
  fs.mkdirSync(userData, { recursive: true });
  const file = path.join(userData, 'installation.json');
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id)) {
      throw new Error('Identidade local inválida; preserve o arquivo para diagnóstico.');
    }
    return { id: value.id };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const value = { id: randomUUID() };
    // Publica um arquivo completo de forma exclusiva, inclusive entre processos.
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
      try { fs.linkSync(temporary, file); }
      catch (err) { if (err.code !== 'EEXIST') throw err; }
    } finally { fs.rmSync(temporary, { force: true }); }
    return loadInstallation(userData);
  }
}
module.exports = { loadInstallation };
