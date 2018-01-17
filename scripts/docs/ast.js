var lexer = require('../../lib').lexer;
var TOC_RX = /(<!-- MarkdownTOC .*?-->\n+)((?:\s|.)*?)(\n+<!-- \/MarkdownTOC -->)/;
var ARTICLES_RX = /(<!-- node types -->\n+)((?:\s|.)*?)(\n+<!-- \/node types -->)/;

function genNodeStructure(docs) {
    return '{\n' +
        Object.keys(docs).map(function(field) {
            return '    ' + field + ': ' + docs[field];
        }).join(',\n') +
    '\n}';
}

function updateTOC(md, toc) {
    return md.replace(TOC_RX, function(m, start, content, end) {
        var parts = content.split(/(- \[Node types\]\(#node-types\)\n+)/);
        parts[2] = toc;
        return start + parts.join('') + end;
    });
}

function updateArticles(md, definitions) {
    return md.replace(ARTICLES_RX, function(m, start, content, end) {
        var existing = content
            .split(/\n*### +/g).slice(1)
            .reduce(function(dict, section) {
                var name = section.match(/^\w+/)[0];
                var texts = section.replace(/^\w+\n+/, '').split(/\n*```[a-z]*([^`]+)```\n*/);

                dict[name] = {
                    before: texts[0] || '',
                    after: texts[2] || ''
                };

                return dict;
            }, {});

        var articles = definitions.map(function(section) {
            var type = section.type;
            var article = existing[type] || {};

            return (
                '### ' + type + '\n\n' +
                (article.before ? article.before + '\n\n' : '') +
                '```js\n' +
                genNodeStructure(lexer.structure[type].docs) +
                '\n```' +
                (article.after ?  '\n\n' + article.after : '')
            );
        });

        return start + articles.join('\n\n') + end;
    });
}

module.exports = function(md) {
    var toc = [];
    var types = [];

    Object.keys(lexer.structure).sort().forEach(function(type) {
        toc.push('    - [' + type + '](#' + type.toLowerCase() + ')');
        types.push({
            type: type,
            structure: lexer.structure[type].docs
        });
    });

    md = updateTOC(md, toc.join('\n'));
    md = updateArticles(md, types);

    return md;
};
