var mdnProperties = require('mdn-data/css/properties.json');
var mdnSyntaxes = require('mdn-data/css/syntaxes.json');
var patch = require('./patch.json');
var data = {
    properties: {},
    types: {},
    defs: {
        Atrule: require('./known/Atrule.json').items,
        Declaration: require('./known/Declaration.json').items,
        Dimension: require('./known/Dimension.json').items,
        Function: require('./known/Function.json').items,
        MediaFeature: require('./known/MediaFeature.json').items,
        PseudoClassSelector: require('./known/PseudoClassSelector.json').items,
        PseudoElementSelector: require('./known/PseudoElementSelector.json').items
    }
};

function normalizeSyntax(syntax) {
    return syntax
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
}

function patchDict(dict, patchDict) {
    for (var key in patchDict) {
        if (key in dict) {
            if (patchDict[key].syntax) {
                dict[key].syntax = patchDict[key].syntax;
            } else {
                delete dict[key];
            }
        } else {
            if (patchDict[key].syntax) {
                dict[key] = patchDict[key];
            }
        }
    }
}

// apply patch
patchDict(mdnProperties, patch.properties);
patchDict(mdnSyntaxes, patch.syntaxes);

// normalize source mdnProperties syntaxes, since it uses html token
for (var key in mdnProperties) {
    data.properties[key] = normalizeSyntax(mdnProperties[key].syntax);
}

for (var key in mdnSyntaxes) {
    data.types[key] = normalizeSyntax(mdnSyntaxes[key].syntax);
}

// normalize defs
Object.keys(data.defs).forEach(function(type) {
    var items = data.defs[type];

    if (Array.isArray(items)) {
        data.defs[type] = items.reduce(function(res, item) {
            var value = true;

            if (type === 'PseudoClassSelector' || type === 'PseudoElementSelector') {
                if (/\(\)$/.test(item)) {
                    item = item.substr(0, item.length - 2);
                    value = 2; // functional pseudo
                } else {
                    value = 1; // non-function pseudo
                }
                value |= res[item] || 0;  // 3 – both
            }

            res[item] = value;
            return res;
        }, {});
    }
});

module.exports = data;
