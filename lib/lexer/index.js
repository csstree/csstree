'use strict';

module.exports = {
    Lexer: require('./Lexer'),
    create: require('./Lexer').create,
    defaultSyntax: require('./default'),
    parse: require('./parse'),
    translate: require('./translate'),
    walk: require('./walk')
};
