import fs from 'fs';
import url from 'url';
import path from 'path';
import { createRequire } from 'module';
import csstree from '../../../lib/index.js';
import JsonLocator from '../../helpers/JsonLocator.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const { createLexer, lexer: defaultLexer } = csstree;

export function forEachTest(factory) {
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

export function forEachAtrulePreludeTest(factory) {
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

export function forEachAtruleDescriptorTest(factory) {
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

export const tests = fs.readdirSync(__dirname).reduce(function(result, fn) {
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

export const atruleTests = (() => {
    const filename = path.join(__dirname, 'atrules.json');
    const tests = require(filename);
    const locator = new JsonLocator(filename);

    for (const key of Object.keys(tests)) {
        tests[key].name = locator.get(key);
    }

    return tests;
})();
