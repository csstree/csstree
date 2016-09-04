var original = require('./data.json');
var patch = require('./patch.json');

for (var key in patch.properties) {
    original.properties[key].syntax = patch.properties[key].syntax;
}

for (var key in patch.syntaxes) {
    original.syntaxes[key] = patch.syntaxes[key].syntax;
}

// odd syntax, delete for now
delete original.syntaxes['an-plus-b'];

module.exports = original;
