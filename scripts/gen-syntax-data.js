var resultFilename = require('path').resolve(__dirname + '/../dist/default-syntax.json');
var syntax = require('../lib/syntax/default');

console.log('Write data to ' + resultFilename);
require('fs').writeFileSync(
  resultFilename,
  syntax
);
