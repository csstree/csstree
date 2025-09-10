import fs from 'fs';
import path from 'path';
import { createLexer, lexer as defaultLexer } from 'css-tree';
import { JsonLocator } from '../helpers/JsonLocator.js';

const __dirname = 'fixtures/definition-syntax';

export function forEachTest(factory) {
    for (const file of Object.values(tests)) {
        for (const test of Object.values(file)) {
            const syntax = test.syntax;
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

export function forEachAtrulePreludeTest(factory) {
    for (const [atruleName, testset] of Object.entries(atruleTests)) {
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

export function forEachAtruleDescriptorTest(factory) {
    for (const [atruleName, testset] of Object.entries(atruleTests)) {
        if (testset.descriptors) {
            for (const [descriptorName, test] of Object.entries(testset.descriptors)) {
                for (const field of Object.keys(test)) {
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

export const tests = fs.readdirSync(__dirname).reduce(function(result, fn) {
    if (path.extname(fn) === '.json' && fn !== 'atrules.json') {
        const filename = path.join(__dirname, fn);
        const tests = JSON.parse(fs.readFileSync(filename));
        const locator = new JsonLocator(filename);

        for (const key of Object.keys(tests)) {
            const test = tests[key];

            test.name = locator.get(key);

            if (!test.syntax && !test.property && !test.type) {
                test.syntax = key;
            }
        }

        result[filename] = tests;
    }

    return result;
}, {});

export const atruleTests = (() => {
    const filename = path.join(__dirname, 'atrules.json');
    const tests = JSON.parse(fs.readFileSync(filename));
    const locator = new JsonLocator(filename);

    for (const key of Object.keys(tests)) {
        tests[key].name = locator.get(key);
    }

    return tests;
})();
