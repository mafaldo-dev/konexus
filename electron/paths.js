const path = require('path');

const getPath = (relativePath) => {
  return path.join(__dirname, ...relativePath.split('/'));
};

module.exports = {
  buildPath: getPath('../build'),
  preloadPath: getPath('preload.js')
};