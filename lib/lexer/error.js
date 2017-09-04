'use strict';

var translateGrammar = require('./grammar/translate');

function getLocation(node, point) {
    var loc = node && node.loc && node.loc[point];

    return loc
        ? { offset: loc.offset,
            line: loc.line,
            column: loc.column }
        : null;
}

var SyntaxReferenceError = function(type, referenceName) {
    // some VMs prevent setting line/column otherwise (iOS Safari 10 even throw an exception)
    var error = Object.create(SyntaxError.prototype);

    error.name = 'SyntaxReferenceError';
    error.reference = referenceName;
    error.message = type + ' `' + referenceName + '`';
    error.stack = (new Error().stack || '').replace(/^.+\n/, error.name + ': ' + error.message + '\n');

    return error;
};

var MatchError = function(message, lexer, syntax, value, badNode) {
    // some VMs prevent setting line/column otherwise (iOS Safari 10 even throw an exception)
    var error = Object.create(SyntaxError.prototype);
    var errorOffset = -1;
    var start = getLocation(badNode, 'start');
    var end = getLocation(badNode, 'end');
    var css = lexer.syntax.translateMarkup(value, function(node, buffer) {
        if (node === badNode) {
            errorOffset = buffer.length;
        }
    });

    if (errorOffset === -1) {
        errorOffset = css.length;
    }

    error.name = 'SyntaxMatchError';
    error.rawMessage = message;
    error.stack = (new Error().stack || '').replace(/^.+\n/, error.name + ': ' + message + '\n');
    error.syntax = syntax ? translateGrammar(syntax) : '<generic>';
    error.css = css;
    error.mismatchOffset = errorOffset;
    error.loc = {
        source: badNode && badNode.loc && badNode.loc.source || '<unknown>',
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
