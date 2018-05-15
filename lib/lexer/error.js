'use strict';

var createCustomError = require('../utils/createCustomError');
var generateGrammar = require('./grammar/generate');

function getLocation(node, point) {
    var loc = node && node.loc && node.loc[point];

    if (loc) {
        return {
            offset: loc.offset,
            line: loc.line,
            column: loc.column
        };
    }

    return null;
}

var SyntaxReferenceError = function(type, referenceName) {
    var error = createCustomError(
        'SyntaxReferenceError',
        type + (referenceName ? ' `' + referenceName + '`' : '')
    );

    error.reference = referenceName;

    return error;
};

var MatchError = function(message, lexer, syntax, node, tokens, details) {
    var error = createCustomError('SyntaxMatchError', message);
    var mismatchOffset = details.offset || 0;
    var badNode = (details.token && details.token.node) || node;
    var start = getLocation(badNode, badNode !== node || mismatchOffset === 0 ? 'start' : 'end');
    var end = getLocation(badNode, 'end');
    var css = details.value;

    error.rawMessage = message;
    error.syntax = syntax ? generateGrammar(syntax) : '<generic>';
    error.css = css;
    error.mismatchOffset = mismatchOffset;
    error.loc = {
        source: (badNode && badNode.loc && badNode.loc.source) || '<unknown>',
        start: start,
        end: end
    };
    error.line = start ? start.line : undefined;
    error.column = start ? start.column : undefined;
    error.offset = start ? start.offset : undefined;
    error.message = message + '\n' +
        '  syntax: ' + error.syntax + '\n' +
        '   value: ' + (error.css || '<empty string>') + '\n' +
        '  --------' + new Array(error.mismatchOffset + 1).join('-') + '^';

    return error;
};

module.exports = {
    SyntaxReferenceError: SyntaxReferenceError,
    MatchError: MatchError
};
