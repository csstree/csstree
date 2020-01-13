const fs = require('fs');
const path = require('path');
const JsonLocator = require('../../helpers/JsonLocator.js');

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function camelize(str) {
    return str.replace(
        /(^|-)(.)/g,
        (_, prefix, ch) => prefix + ch.toUpperCase()
    );
}

function processTests(tests, key, type, locator) {
    return ensureArray(tests[key]).map((value, idx) => {
        return {
            name: locator.get(key, idx),
            ...typeof value === 'string'
                ? { value, tokens: [{ type, chunk: value }] }
                : value
        };
    });
}

function forEachTest(testType, factory) {
    for (const filename in tests) {
        const file = tests[filename];

        Object.keys(file[testType]).forEach(key => factory(
            file[testType][key].name,
            file[testType][key].value,
            file[testType][key].tokens,
            file.type
        ));
    };
}

const tests = fs.readdirSync(__dirname).reduce(function(result, filename) {
    const absFilename = path.join(__dirname, filename);

    if (path.extname(filename) !== '.json' || fs.statSync(absFilename).isDirectory()) {
        return result;
    }

    const locator = new JsonLocator(absFilename);
    const tests = require(absFilename);
    const type = path.basename(filename, '.json').replace(
        /^(.+)-token$/,
        (_, type) => camelize(type)
    );

    result[filename] = {
        type,
        valid: processTests(tests, 'valid', type, locator),
        invalid: processTests(tests, 'invalid', type, locator)
    };

    return result;
}, {});

module.exports = {
    forEachTest,
    tests
};
