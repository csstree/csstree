import { lexer } from '../../lib/index.js';

const TOC_RX = /(<!-- MarkdownTOC .*?-->\n+)((?:\s|.)*?)(\n+<!-- \/MarkdownTOC -->)/;
const ARTICLES_RX = /(<!-- node types -->\n+)((?:\s|.)*?)(\n+<!-- \/node types -->)/;

function genNodeStructure(docs) {
    return '{\n' +
        Object.keys(docs).map(field => `    ${field}: ${docs[field]}`).join(',\n') +
    '\n}';
}

function updateTOC(md, toc) {
    return md.replace(TOC_RX, function(m, start, content, end) {
        const parts = content.split(/(- \[Node types\]\(#node-types\)\n+)/);
        parts[2] = toc;
        return start + parts.join('') + end;
    });
}

function updateArticles(md, definitions) {
    return md.replace(ARTICLES_RX, function(m, start, content, end) {
        const existing = content
            .split(/\n*### +/g).slice(1)
            .reduce(function(dict, section) {
                const name = section.match(/^\w+/)[0];
                const texts = section.replace(/^\w+\n+/, '').split(/\n*```[a-z]*([^`]+)```\n*/);

                dict[name] = {
                    before: texts[0] || '',
                    after: texts[2] || ''
                };

                return dict;
            }, {});

        const articles = definitions.map(function(section) {
            const type = section.type;
            const article = existing[type] || {};

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

export default function(md) {
    const toc = [];
    const types = [];

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
