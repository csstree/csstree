var fs = require('fs');
var path = require('path');
var createLexer = require('../../../lib').createLexer;
var defaultLexer = require('../../../lib').lexer;
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var test in file) {
            var syntax = file[test].syntax;
            var lexer = syntax && typeof syntax !== 'string' ? createLexer(syntax) : defaultLexer;

            for (var property in file[test]) {
                if (property !== 'valid' && property !== 'invalid') {
                    continue;
                }

                file[test][property].forEach(function(value, idx) {
                    factory(
                        file[test].name + ' ' + property + '#' + idx,
                        lexer,
                        file[test].property || 'test',
                        value,
                        property === 'invalid',
                        typeof syntax === 'string' ? syntax : undefined
                    );
                });
            }
        }
    };
}

var testFiles = fs.readdirSync(__dirname).reduce(function(result, fn) {
    if (fn !== 'index.js') {
        var filename = path.join(__dirname, fn);
        var tests = require(filename);
        var locator = new JsonLocator(filename);

        Object.keys(tests).forEach(function(key) {
            tests[key].name = locator.get(key);
        });

        result[filename] = tests;
    }

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: testFiles
};
