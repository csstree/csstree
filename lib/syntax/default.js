var data = require('../../data');
var syntax = require('./syntax').create({
    generic: true
});

for (var key in data.properties) {
    syntax.addProperty(key, data.properties[key].syntax);
}

for (var key in data.syntaxes) {
    syntax.addType(key, data.syntaxes[key]);
}

module.exports = syntax;
