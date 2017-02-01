var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');
var wrapper = {
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
    stylesheet: function(ast) {
        return {
            type: 'StyleSheet',
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
                var filename = path.join(dir, fn);

                if (fs.statSync(filename).isDirectory()) {
                    return scanDir(filename);
                }

                var tests = require(filename);
                var errors = {};
                var locator = new JsonLocator(filename);

                for (var key in tests) {
                    tests[key].name = locator.get(key);
                    if (tests[key].error) {
                        if (typeof tests[key].offset === 'string') {
                            var offset = tests[key].offset.indexOf('^');
                            var lines = tests[key].source.substr(0, offset).split(/\r|\r\n|\n|\f/g);
                            var position = {
                                offset: offset,
                                line: lines.length,
                                column: lines.pop().length + 1
                            };

                            tests[key].position = position;
                        }
                        errors[key] = tests[key];
                        delete tests[key];
                    } else if (tests[key].ast.type.toLowerCase() !== scope.toLowerCase() && wrapper.hasOwnProperty(scope)) {
                        tests[key].ast = wrapper[scope](tests[key].ast);
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
