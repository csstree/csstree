'use strict';

var walkers = require('./utils/walk');
var names = require('./utils/names');

module.exports = {
    List: require('./utils/list'),
    Scanner: require('./scanner'),

    syntax: require('./syntax'),
    property: names.property,
    keyword: names.keyword,

    parse: require('./parser'),
    clone: require('./utils/clone'),
    fromPlainObject: require('./utils/convert').fromPlainObject,
    toPlainObject: require('./utils/convert').toPlainObject,

    walk: walkers.all,
    walkUp: walkers.allUp,
    walkRules: walkers.rules,
    walkRulesRight: walkers.rulesRight,
    walkDeclarations: walkers.declarations,

    translate: require('./utils/translate'),
    translateWithSourceMap: require('./utils/translateWithSourceMap')
};
