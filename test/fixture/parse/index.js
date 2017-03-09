var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');
var merge = require('../../helpers').merge;
var wrapper = {
    stylesheet: function(ast) {
        return {
            type: 'StyleSheet',
            children: [ast]
        };
    },
    mediaQuery: function(ast) {
        return {
            type: 'MediaQuery',
            children: [ast]
        };
    },
    rule: function(ast) {
        return {
            type: 'Rule',
            selector: {
                type: 'SelectorList',
                children: []
            },
            block: ast
        };
    },
    selector: function(ast) {
        return {
            type: 'Selector',
            children: [ast]
        };
    },
    value: function(ast) {
        return {
            type: 'Value',
            children: [ast]
        };
    }
};

function forEachTest(factory, errors) {
    var testType = errors === true ? 'errors' : 'tests';
    for (var filename in tests) {
        var file = tests[filename];

        for (var key in file[testType]) {
            factory(file[testType][key].name, file[testType][key], file.scope);
        }
    };
}

var tests = fs.readdirSync(__dirname).reduce(function(result, scope) {
    function scanDir(dir) {
        if (fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir).forEach(function(fn) {
                function processTest(test, key, storeKey) {
                    if (test.error) {
                        if (typeof test.offset === 'string') {
                            var offset = test.offset.indexOf('^');
                            var lines = test.source.substr(0, offset).split(/\r|\r\n|\n|\f/g);
                            var position = {
                                offset: offset,
                                line: lines.length,
                                column: lines.pop().length + 1
                            };

                            test.position = position;
                        }
                        errors[storeKey] = test;
                    } else {
                        if (test.source === test.translate) {
                            console.warn('[WARN] Test `source` and `translate` fields are equal: ' + test.name);
                        }

                        if (test.ast.type.toLowerCase() !== scope.toLowerCase() && wrapper.hasOwnProperty(scope)) {
                            test.ast = wrapper[scope](test.ast);
                        }
                        tests[storeKey] = test;
                    }
                }

                var filename = path.join(dir, fn);

                if (fs.statSync(filename).isDirectory()) {
                    return scanDir(filename);
                }

                var locator = new JsonLocator(filename);
                var origTests = require(filename);
                var tests = {};
                var errors = {};

                for (var key in origTests) {
                    if (Array.isArray(origTests[key])) {
                        origTests[key].forEach(function(test, idx) {
                            test.name = locator.get(key, idx);
                            test.options = merge(test.options, {
                                context: scope
                            });
                            processTest(test, key, key + '#' + (idx + 1));
                        });
                    } else {
                        origTests[key].name = locator.get(key);
                        origTests[key].options = merge(origTests[key].options, {
                            context: scope
                        });
                        processTest(origTests[key], key, key);
                    }
                }

                result[filename] = {
                    scope: scope,
                    tests: tests,
                    errors: errors
                };
            });
        }
    }

    scanDir(path.join(__dirname, scope));

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: tests
};
