var data = require('../../data');
var syntax = require('./syntax').create({
    generic: true
});

for (var key in data.properties) {
    syntax.addProperty(key, data.properties[key]);
}

for (var key in data.types) {
    syntax.addType(key, data.types[key]);
}

module.exports = syntax;
