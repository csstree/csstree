var data = require('./data.json');
var patch = require('./patch.json');

function normalizeSyntax(syntax) {
    return syntax
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

// apply patch
for (var key in patch.properties) {
    if (key in data.properties) {
        data.properties[key].syntax = patch.properties[key].syntax;
    } else {
        data.properties[key] = patch.properties[key];
    }
}

for (var key in patch.syntaxes) {
    if (patch.syntaxes[key].syntax) {
        data.syntaxes[key] = patch.syntaxes[key].syntax;
    } else {
        delete data.syntaxes[key];
    }
}

// normalize source data syntaxes, since it uses html token
for (var key in data.properties) {
    data.properties[key].syntax = normalizeSyntax(data.properties[key].syntax);
}

for (var key in data.syntaxes) {
    data.syntaxes[key] = normalizeSyntax(data.syntaxes[key]);
}

module.exports = data;
