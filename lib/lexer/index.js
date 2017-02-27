'use strict';

module.exports = {
    Lexer: require('./Lexer'),
    grammar: {
        parse: require('./parse'),
        translate: require('./translate'),
        walk: require('./walk')
    }
};
