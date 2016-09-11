var mozilla = require('./mozilla-cssdata.json');
var patch = require('./patch.json');
var data = {
    properties: {},
    types: {}
};

function normalizeSyntax(syntax) {
    return syntax
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

// apply patch
for (var key in patch.properties) {
    if (key in mozilla.properties) {
        mozilla.properties[key].syntax = patch.properties[key].syntax;
    } else {
        mozilla.properties[key] = patch.properties[key];
    }
}

for (var key in patch.syntaxes) {
    if (patch.syntaxes[key].syntax) {
        mozilla.syntaxes[key] = patch.syntaxes[key].syntax;
    } else {
        delete mozilla.syntaxes[key];
    }
}

// normalize source mozilla syntaxes, since it uses html token
for (var key in mozilla.properties) {
    data.properties[key] = normalizeSyntax(mozilla.properties[key].syntax);
}

for (var key in mozilla.syntaxes) {
    data.types[key] = normalizeSyntax(mozilla.syntaxes[key]);
}

module.exports = data;
