const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const version = packageJson.version;

const content = `export const version = '${version}';\n`;

const targetPath = path.join(__dirname, '../src/version.ts');

fs.writeFileSync(targetPath, content);

console.log(`Version ${version} written to src/version.ts`);
