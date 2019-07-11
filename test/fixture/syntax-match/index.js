var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var key in file) {
            factory(key, file[key]);
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
