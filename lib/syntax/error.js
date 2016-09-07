var stringifySyntax = require('./stringify');
var translateCss = require('../utils/translate');

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
        if (badNode && badNode.data === node) {
            errorOffset = css.length;
        }

        css += translateCss(node);
    });

    if (errorOffset === -1) {
        errorOffset = css.length;
    }

    var error = new SyntaxError(message);
    error.name = 'SyntaxMatchError';
    error.syntax = stringifySyntax(syntax);
    error.css = css;
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
