const fs = require('fs');
const path = require('path');
const createLexer = require('../../../lib').createLexer;
const defaultLexer = require('../../../lib').lexer;
const JsonLocator = require('../../helpers/JsonLocator.js');

function forEachTest(factory) {
    for (const filename in tests) {
        const file = tests[filename];

        for (const key in file) {
            const test = file[key];
            const syntax = test.syntax || (!test.property && !test.type ? key : undefined);
            const lexer = test.lexer ? createLexer(test.lexer) : defaultLexer;

            for (const field in test) {
                if (field !== 'valid' && field !== 'invalid') {
                    continue;
                }

                test[field].forEach((value, idx) => {
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
    for (const atruleName in atruleTests) {
        const testset = atruleTests[atruleName];

        if (testset.prelude) {
            const test = testset.prelude;
            for (const field in test) {
                if (field !== 'valid' && field !== 'invalid') {
                    continue;
                }

                test[field].forEach((value, idx) => {
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
    for (const atruleName in atruleTests) {
        const testset = atruleTests[atruleName];

        if (testset.descriptors) {
            for (const descriptorName in testset.descriptors) {
                const test = testset.descriptors[descriptorName];
                for (const field in test) {
                    if (field !== 'valid' && field !== 'invalid') {
                        continue;
                    }

                    test[field].forEach((value, idx) => {
                        factory(
                            field,
                            testset.test,
                            `${testset.name} @${atruleName} descriptor ${descriptorName} ${field}#${idx}`,
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

const tests = fs.readdirSync(__dirname).reduce(function(result, fn) {
    if (fn !== 'index.js' && fn !== 'atrules.json') {
        const filename = path.join(__dirname, fn);
        const tests = require(filename);
        const locator = new JsonLocator(filename);

        for (const key of Object.keys(tests)) {
            tests[key].name = locator.get(key);
        }

        result[filename] = tests;
    }

    return result;
}, {});

const atruleTests = (() => {
    const filename = path.join(__dirname, 'atrules.json');
    const tests = require(filename);
    const locator = new JsonLocator(filename);

    for (const key of Object.keys(tests)) {
        tests[key].name = locator.get(key);
    }

    return tests;
})();

module.exports = {
    forEachTest,
    forEachAtrulePreludeTest,
    forEachAtruleDescriptorTest,
    tests,
    atruleTests
};
