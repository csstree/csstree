var fs = require('fs');
var path = require('path');
var createSyntax = require('../../../lib/lexer').create;
var defaultSyntax = require('../../../lib/lexer/default');
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var test in file) {
            var syntax = file[test].syntax ? createSyntax(file[test].syntax) : defaultSyntax;

            for (var property in file[test]) {
                if (property !== 'valid' && !/^invalid:/.test(property)) {
                    continue;
                }

                file[test][property].forEach(function(value, idx) {
                    factory(
                        file[test].name + ' ' + property + '#' + idx,
                        syntax,
                        file[test].property || 'test',
                        value,
                        property !== 'valid' ? property.substr(8) : false
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

        for (var key in tests) {
            tests[key].name = locator.get(key);
        }

        result[filename] = tests;
    }

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: testFiles
};
