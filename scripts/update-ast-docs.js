var fs = require('fs');
var csstree = require('../lib');
var syntax = csstree.syntax.defaultSyntax;
var filename = __dirname + '/../docs/ast.md';

function genNodeStructure(docs) {
    return '{\n' +
        Object.keys(docs).map(function(field) {
            return '    "' + field + '": ' + docs[field];
        }).join(',\n') +
    '\n}';
}

var md = fs.readFileSync(filename, 'utf8');
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

Object.keys(syntax.structure).sort().forEach(function(type) {
    toc.push('- [' + type + '](#' + type.toLowerCase() + ')');
    sections.push(
        '## ' + type + '\n\n' +
        (types[type].before ? types[type].before + '\n\n' : '') +
        '```\n' +
        genNodeStructure(syntax.structure[type].docs) +
        '\n```' +
        (types[type].after ?  '\n\n' + types[type].after : '') +
        '\n'
    );
});

mdParts[2] = '\n' + toc.join('\n') + '\n';
mdParts[4] = '\n' + sections.join('\n');

fs.writeFileSync(filename, mdParts.join(''), 'utf8');
