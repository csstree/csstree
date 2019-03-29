var fs = require('fs');
var path = require('path');
var JsonLocator = require('../../helpers/JsonLocator.js');

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function camelize(str) {
    return str.replace(/(^|-)(.)/g, (_, prefix, ch) => prefix + ch.toUpperCase());
}

function processTests(tests, key, type, locator) {
    return ensureArray(tests[key]).map(function(value, idx) {
        return Object.assign(
            { name: locator.get(key, idx) },
            typeof value === 'string'
                ? { value, tokens: [{ type, chunk: value }] }
                : value
        );
    });
}

function forEachTest(testType, factory) {
    for (var filename in tests) {
        var file = tests[filename];

        Object.keys(file[testType]).forEach(function(key) {
            factory(file[testType][key].name, file[testType][key].value, file[testType][key].tokens, file.type);
        });
    };
}

var tests = fs.readdirSync(__dirname).reduce(function(result, filename) {
    const absFilename = path.join(__dirname, filename);

    if (path.extname(filename) !== '.json' || fs.statSync(absFilename).isDirectory()) {
        return result;
    }

    var locator = new JsonLocator(absFilename);
    var tests = require(absFilename);
    var type = path.basename(filename, '.json').replace(/^(.+)-token$/, (_, type) => camelize(type));

    result[filename] = {
        type: type,
        valid: processTests(tests, 'valid', type, locator),
        invalid: processTests(tests, 'invalid', type, locator)
    };

    return result;
}, {});

module.exports = {
    forEachTest: forEachTest,
    tests: tests
};
