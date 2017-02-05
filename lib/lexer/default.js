'use strict';

var data = require('../../data');

module.exports = require('./Lexer').create({
    generic: true,
    types: data.types,
    properties: data.properties
});
