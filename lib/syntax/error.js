var translateSyntax = require('./translate');
var translateCss = require('../utils/translate');
var walk = require('../utils/walk').all;

function contains(node, searchFor) {
    var found = false;

    walk(node, function(descendant) {
        if (descendant === searchFor) {
            found = true;
        }
    });

    return found;
}

var SyntaxParseError = function(message, syntaxStr, offset) {
    var error = new SyntaxError();
    error.name = 'SyntaxParseError';
    error.rawMessage = message;
    error.syntax = syntaxStr;
    error.offset = offset;
    error.message = error.rawMessage + '\n' +
        '  ' + error.syntax + '\n' +
        '--' + new Array((error.offset || error.syntax.length) + 1).join('-') + '^';

    return error;
};

var MatchError = function(message, syntax, value, badNode) {
    var errorOffset = -1;
    var css = '';

    value.sequence.each(function(node) {
        if (badNode === node || (badNode && contains(node, badNode))) {
            errorOffset = css.length;
        }

        css += translateCss(node);
    });

    if (errorOffset === -1) {
        errorOffset = css.length;
    }

    var error = new SyntaxError(message);
    error.name = 'SyntaxMatchError';
    error.rawMessage = message;
    error.syntax = syntax ? translateSyntax(syntax) : '<generic>';
    error.css = css;
    error.line = badNode && badNode.info ? badNode.info.line : undefined;
    error.column = badNode && badNode.info ? badNode.info.column : undefined;
    error.offset = errorOffset;
    error.message = message + '\n' +
        '  syntax: ' + error.syntax + '\n' +
        '   value: ' + (error.css || '<empty string>') + '\n' +
        '  --------' + new Array(error.offset + 1).join('-') + '^';

    return error;
};

module.exports = {
    SyntaxParseError: SyntaxParseError,
    MatchError: MatchError
};
