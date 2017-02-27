var resultFilename = require('path').resolve(__dirname + '/../dist/default-syntax.json');
var defaultSyntax = require('../lib').defaultLexer;

console.log('Write data to ' + resultFilename);
require('fs').writeFileSync(
  resultFilename,
  defaultSyntax
);
