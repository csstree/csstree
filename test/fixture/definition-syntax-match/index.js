const fs = require('fs');
const path = require('path');
const JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (const filename in tests) {
        const file = tests[filename];

        for (const key in file) {
            factory(key, file[key]);
        }
    };
}

const tests = fs.readdirSync(__dirname).reduce((result, fn) => {
    if (fn !== 'index.js') {
        const filename = path.join(__dirname, fn);
        const tests = require(filename);
        const locator = new JsonLocator(filename);

        Object.keys(tests).forEach(key => {
            tests[key].name = locator.get(key);
        });

        result[filename] = tests;
    }

    return result;
}, {});

module.exports = {
    forEachTest,
    tests
};
