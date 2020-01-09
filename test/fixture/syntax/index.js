var fs = require('fs');
var path = require('path');
var createLexer = require('../../../lib').createLexer;
var defaultLexer = require('../../../lib').lexer;
var JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (var filename in testFiles) {
        var file = testFiles[filename];

        for (var key in file) {
            var test = file[key];
            var syntax = test.syntax || (!test.property && !test.type ? key : undefined);
            var lexer = test.lexer ? createLexer(test.lexer) : defaultLexer;

            for (var field in test) {
                if (field !== 'valid' && field !== 'invalid') {
                    continue;
                }

                test[field].forEach(function(value, idx) {
                    factory(
                        field,
                        test.test,
                        test.name + ' ' + field + '#' + idx,
                        lexer,
                        test.property,
                        value,
                        typeof syntax === 'string' ? syntax : undefined
                    );
                });
            }
        }
    }
}

function forEachAtrulePreludeTest(factory) {
    for (var atruleName in atruleTests) {
        var testset = atruleTests[atruleName];

        if (testset.prelude) {
            var test = testset.prelude;
            for (var field in test) {
                if (field !== 'valid' && field !== 'invalid') {
                    continue;
                }

                test[field].forEach(function(value, idx) {
                    factory(
                        field,
                        testset.test,
                        testset.name + ' @' + atruleName + ' prelude ' + field + '#' + idx,
                        defaultLexer,
                        atruleName,
                        value
                    );
                });
            }
        }
    }
}

function forEachAtruleDescriptorTest(factory) {
    for (var atruleName in atruleTests) {
        var testset = atruleTests[atruleName];

        if (testset.descriptors) {
            for (var descriptorName in testset.descriptors) {
                var test = testset.descriptors[descriptorName];
                for (var field in test) {
                    if (field !== 'valid' && field !== 'invalid') {
                        continue;
                    }

                    test[field].forEach(function(value, idx) {
                        factory(
                            field,
                            testset.test,
                            testset.name + ' @' + atruleName + ' descriptor ' + descriptorName + ' ' + field + '#' + idx,
                            defaultLexer,
                            atruleName,
                            descriptorName,
                            value
                        );
                    });
                }
            }
        }
    }
}

var testFiles = fs.readdirSync(__dirname).reduce(function(result, fn) {
    if (fn !== 'index.js' && fn !== 'atrules.json') {
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

var atruleTests = (function() {
    var filename = path.join(__dirname, 'atrules.json');
    var tests = require(filename);
    var locator = new JsonLocator(filename);

    Object.keys(tests).forEach(function(key) {
        tests[key].name = locator.get(key);
    });

    return tests;
}());

module.exports = {
    forEachTest,
    forEachAtrulePreludeTest,
    forEachAtruleDescriptorTest,
    tests: testFiles,
    atruleTests
};
