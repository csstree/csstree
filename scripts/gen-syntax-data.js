var resultFilename = require('path').resolve(__dirname + '/../docs/syntax.json');
var data = require('../data');
var syntax = require('../lib/syntax').create({
    generic: true
});

for (var key in data.properties) {
    syntax.addProperty(key, data.properties[key].syntax);
}

for (var key in data.syntaxes) {
    syntax.addType(key, data.syntaxes[key]);
}

console.log('Write data to ' + resultFilename);
require('fs').writeFileSync(resultFilename, syntax);
