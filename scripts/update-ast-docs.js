var fs = require('fs');
var csstree = require('../lib');
var lexer = csstree.lexer;
var filename = __dirname + '/../docs/ast.md';

function genNodeStructure(docs) {
    return '{\n' +
        Object.keys(docs).map(function(field) {
            return '    "' + field + '": ' + docs[field];
        }).join(',\n') +
    '\n}';
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function genNodeSamples(samples) {
    return (
        '<table>' +
            '<thead><tr>' +
                '<th>CSS</th>' +
                '<th>Stringify (default)</th>' +
                '<th>AST</th>' +
            '</tr></thead>' +
            '<tbody>\n' +
            samples.map(function(sample) {
                var ast = '';
                var str = '-';
                var lines = 1;

                try {
                    ast = csstree.parse(samples);
                    str = csstree.translate(ast);
                    ast = JSON.stringify(ast, null, 4);
                    lines = (ast.match(/\n/g) || []).length + 1;
                } catch (e) {
                    ast = 'Parse error';
                }

                return (
                    '<tr>' +
                        '<td>' + escapeHtml(sample) + '</td>' +
                        '<td>' + escapeHtml(str) + '</td>' +
                        '<td>' +
                            (lines > 10 ? '<details><summary>' + lines + ' lines</summary>' : '') +
                            '<pre>' + escapeHtml(ast) + '</pre>' +
                            (lines > 10 ? '</details>' : '') +
                        '</td>' +
                    '</tr>'
                );
            }).join('\n') +
            '\n</tbody>' +
        '</table>'
    );
}

var md = fs.readFileSync(filename, 'utf8').replace(/\r\n?/g, '\n');
var mdParts = md.split(/(\n<!-- \/?MarkdownTOC .*?-->\n)/);
var toc = [];
var sections = [];
var types = mdParts[4]
    .split(/\n*## +/g).slice(1)
    .reduce(function(dict, section) {
        var name = section.match(/^\w+/)[0];
        var texts = section.replace(/^\w+\n+/, '').split(/\n*```(?:[^`]+)```\n*/);
        var afterText = (texts[1] || '').split(/\n*<table>(?:(?:.|\s)*)<\/table>\n*/i);

        dict[name] = {
            first: texts[0] || '',
            middle: afterText[0] || '',
            last: afterText[1] || ''
        };

        return dict;
    }, {});

Object.keys(lexer.structure).sort().forEach(function(type) {
    var info = types[type] || {};
    var samples = lexer.structure[type].samples || null;
    console.log(lexer.structure[type].samples);

    toc.push('- [' + type + '](#' + type.toLowerCase() + ')');
    sections.push(
        '## ' + type + '\n\n' +
        (info.first ? info.first + '\n\n' : '') +
        '```\n' +
        genNodeStructure(lexer.structure[type].docs) +
        '\n```' +
        (info.middle ?  '\n\n' + info.middle : '') +
        (samples !== null ? '\n\n' + genNodeSamples(samples) : '') +
        (info.last ?  '\n\n' + info.last : '') +
        '\n'
    );
});

mdParts[2] = '\n' + toc.join('\n') + '\n';
mdParts[4] = '\n' + sections.join('\n');

fs.writeFileSync(filename, mdParts.join(''), 'utf8');
