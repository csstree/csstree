var lexer = require('../../lib').lexer;

function genNodeStructure(docs) {
    return '{\n' +
        Object.keys(docs).map(function(field) {
            return '    ' + field + ': ' + docs[field];
        }).join(',\n') +
    '\n}';
}

module.exports = function(md) {
    var mdParts = md.split(/(\n<!-- \/?MarkdownTOC .*?-->\n)/);
    var toc = [];
    var sections = [];
    var types = mdParts[4]
        .split(/\n*## +/g).slice(1)
        .reduce(function(dict, section) {
            var name = section.match(/^\w+/)[0];
            var texts = section.replace(/^\w+\n+/, '').split(/\n*```([^`]+)```\n*/);

            dict[name] = {
                before: texts[0] || '',
                structure: texts[1],
                after: texts[2] || ''
            };

            return dict;
        }, {});

    Object.keys(lexer.structure).sort().forEach(function(type) {
        var info = types[type] || {};

        toc.push('- [' + type + '](#' + type.toLowerCase() + ')');
        sections.push(
            '## ' + type + '\n\n' +
            (info.before ? info.before + '\n\n' : '') +
            '```\n' +
            genNodeStructure(lexer.structure[type].docs) +
            '\n```' +
            (info.after ?  '\n\n' + info.after : '') +
            '\n'
        );
    });

    mdParts[2] = '\n' + toc.join('\n') + '\n';
    mdParts[4] = '\n' + sections.join('\n');

    return mdParts.join('');
};
