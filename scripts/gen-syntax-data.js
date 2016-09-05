var resultFilename = require('path').resolve(__dirname + '/../docs/syntax.json');
var data = require('../data');
var types = require('../lib/syntax/types');
var Syntax = require('../lib/syntax/syntax');
var syntax = new Syntax();

for (var key in types) {
    syntax.addType(key, types[key]);
}

for (var key in data.properties) {
    syntax.addProperty(key, data.properties[key].syntax);
}

for (var key in data.syntaxes) {
    syntax.addType(key, data.syntaxes[key]);
}

console.log('Write data to ' + resultFilename);
require('fs').writeFileSync(resultFilename, syntax);
