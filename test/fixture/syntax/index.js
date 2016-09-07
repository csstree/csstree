var fs = require('fs');
var path = require('path');
var createSyntax = require('../../../lib/syntax').create;
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var test in file) {
            var syntax = createSyntax(file[test].syntax);

            file[test].testcases.forEach(function(testcase, idx) {
                factory(
                    file[test].name + ' #' + idx,
                    syntax,
                    testcase
                );
            });
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
