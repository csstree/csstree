const createCustomError = require('../utils/create-custom-error');
const generate = require('../definition-syntax/generate');

function fromMatchResult(matchResult) {
    const tokens = matchResult.tokens;
    const longestMatch = matchResult.longestMatch;
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

const MatchError = function(message, syntax, node, matchResult) {
    const error = createCustomError('SyntaxMatchError', message);
    const details = fromMatchResult(matchResult);
    const mismatchOffset = details.mismatchOffset || 0;
    const badNode = details.node || node;
    const end = getLocation(badNode, 'end');
    const start = details.last ? end : getLocation(badNode, 'start');
    const css = details.css;

    error.rawMessage = message;
    error.syntax = syntax ? generate(syntax) : '<generic>';
    error.css = css;
    error.mismatchOffset = mismatchOffset;
    error.loc = {
        source: (badNode && badNode.loc && badNode.loc.source) || '<unknown>',
        start,
        end
    };
    error.line = start ? start.line : undefined;
    error.column = start ? start.column : undefined;
    error.offset = start ? start.offset : undefined;
    error.message = message + '\n' +
        '  syntax: ' + error.syntax + '\n' +
        '   value: ' + (error.css || '<empty string>') + '\n' +
        '  --------' + '-'.repeat(error.mismatchOffset) + '^';

    return error;
};

module.exports = {
    SyntaxReferenceError,
    MatchError
};
