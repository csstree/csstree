'use strict';

var SyntaxParseError = function(message, syntaxStr, offset) {
    // some VMs prevent setting line/column otherwise (iOS Safari 10 even throw an exception)
    var error = Object.create(SyntaxError.prototype);

    error.name = 'SyntaxParseError';
    error.rawMessage = message;
    error.stack = (new Error().stack || '').replace(/^.+\n/, error.name + ': ' + message + '\n');
    error.syntax = syntaxStr;
    error.offset = offset;
    error.message = error.rawMessage + '\n' +
        '  ' + error.syntax + '\n' +
        '--' + new Array((error.offset || error.syntax.length) + 1).join('-') + '^';

    return error;
};

module.exports = {
    SyntaxParseError: SyntaxParseError
};
