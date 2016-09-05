var original = require('./data.json');
var patch = require('./patch.json');

for (var key in patch.properties) {
    original.properties[key].syntax = patch.properties[key].syntax;
}

for (var key in patch.syntaxes) {
    if (patch.syntaxes[key].syntax) {
        original.syntaxes[key] = patch.syntaxes[key].syntax;
    } else {
        delete original.syntaxes[key];
    }
}

module.exports = original;
