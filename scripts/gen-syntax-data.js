var resultFilename = require('path').resolve(__dirname + '/../docs/syntax.json');
var syntax = require('../lib/default');

console.log('Write data to ' + resultFilename);
require('fs').writeFileSync(
  resultFilename,
  syntax
);
