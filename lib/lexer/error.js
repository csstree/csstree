const createCustomError = require('../common/create-custom-error');
const generate = require('../definition-syntax/generate');

function fromMatchResult(matchResult) {
    const { tokens, longestMatch } = matchResult;
    const node = longestMatch < tokens.length ? tokens[longestMatch].node : null;
    let mismatchOffset = -1;
    let entries = 0;
    let css = '';

    for (let i = 0; i < tokens.length; i++) {
        if (i === longestMatch) {
            mismatchOffset = css.length;
        }

        if (node !== null && tokens[i].node === node) {
            if (i <= longestMatch) {
                entries++;
            } else {
                entries = 0;
            }
        }

        css += tokens[i].value;
    }

    return {
        node,
        css,
        mismatchOffset: mismatchOffset === -1 ? css.length : mismatchOffset,
        last: node === null || entries > 1
    };
}

function getLocation(node, point) {
    const loc = node && node.loc && node.loc[point];

    if (loc) {
        return {
            offset: loc.offset,
            line: loc.line,
            column: loc.column
        };
    }

    return null;
}

const SyntaxReferenceError = function(type, referenceName) {
    const error = createCustomError(
        'SyntaxReferenceError',
        type + (referenceName ? ' `' + referenceName + '`' : '')
    );

    error.reference = referenceName;

    return error;
};

const MatchError = function(message, syntaxAst, node, matchResult) {
    const details = fromMatchResult(matchResult);
    const mismatchOffset = details.mismatchOffset || 0;
    const badNode = details.node || node;
    const end = getLocation(badNode, 'end');
    const start = details.last ? end : getLocation(badNode, 'start');
    const css = details.css;
    const syntax = syntaxAst ? generate(syntaxAst) : '<generic>';

    return Object.assign(createCustomError('SyntaxMatchError', message), {
        rawMessage: message,
        syntax,
        css,
        mismatchOffset,
        loc: {
            source: (badNode && badNode.loc && badNode.loc.source) || '<unknown>',
            start,
            end
        },
        line: start ? start.line : undefined,
        column: start ? start.column : undefined,
        offset: start ? start.offset : undefined,
        message: message + '\n' +
            '  syntax: ' + syntax + '\n' +
            '   value: ' + (css || '<empty string>') + '\n' +
            '  --------' + '-'.repeat(mismatchOffset) + '^'
    });
};

module.exports = {
    SyntaxReferenceError,
    MatchError
};
