'use strict';

var translateSyntax = require('./grammar/translate');
var translateCss = require('../generator').translate;

function contains(lexer, node, searchFor) {
    var found = false;

    lexer.walker.all(node, function(descendant) {
        if (descendant === searchFor) {
            found = true;
        }
    });

    return found;
}

function getLocation(node, point) {
    var loc = node && node.loc && node.loc[point];

    return loc
        ? { offset: loc.offset,
            line: loc.line,
            column: loc.column }
        : null;
}

var MatchError = function(message, lexer, syntax, value, badNode) {
    var errorOffset = -1;
    var css = '';
    var error = new SyntaxError(message);
    var start = getLocation(badNode, 'start');
    var end = getLocation(badNode, 'end');

    value.children.each(function(node) {
        if (badNode === node || (badNode && contains(lexer, node, badNode))) {
            errorOffset = css.length;
        }

        css += translateCss(node);
    });

    if (errorOffset === -1) {
        errorOffset = css.length;
    }

    error.name = 'SyntaxMatchError';
    error.rawMessage = message;
    error.syntax = syntax ? translateSyntax(syntax) : '<generic>';
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
    MatchError: MatchError
};
