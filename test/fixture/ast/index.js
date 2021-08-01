import fs from 'fs';
import url from 'url';
import path from 'path';
import { createRequire } from 'module';
import JsonLocator from '../../helpers/JsonLocator.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const wrapper = {
    stylesheet: ast => ({
        type: 'StyleSheet',
        children: [ast]
    }),
    mediaQuery: ast => ({
        type: 'MediaQuery',
        children: [ast]
    }),
    rule: ast => ({
        type: 'Rule',
        prelude: {
            type: 'SelectorList',
            children: []
        },
        block: ast
    }),
    selector: ast => ({
        type: 'Selector',
        children: [ast]
    }),
    value: ast => ({
        type: 'Value',
        children: [ast]
    })
};

export function forEachTest(factory, errors) {
    const testType = errors === true ? 'errors' : 'tests';
    for (const filename in tests) {
        const file = tests[filename];

        Object.keys(file[testType]).forEach(function(key) {
            factory(file[testType][key].name, file[testType][key], file.scope);
        });
    };
}

export const tests = fs.readdirSync(__dirname).reduce((result, scope) => {
    function scanDir(dir) {
        if (fs.statSync(dir).isDirectory()) {
            fs.readdirSync(dir).forEach(fn => {
                function processTest(test, storeKey) {
                    if (test.error) {
                        if (typeof test.offset === 'string') {
                            const offset = test.offset.indexOf('^');
                            const lines = test.source.substr(0, offset).split(/\r|\r\n|\n|\f/g);
                            const position = {
                                offset,
                                line: lines.length,
                                column: lines.pop().length + 1
                            };

                            test.position = position;
                        }
                        Object.assign(test.options, {
                            onParseError: error => {
                                throw error;
                            }
                        });
                        errors[storeKey] = test;
                    } else {
                        if (test.source === test.generate) {
                            console.warn('[WARN] Test `source` and `generate` fields are equal: ' + test.name);
                        }

                        if (test.ast.type.toLowerCase() !== scope.toLowerCase() && wrapper.hasOwnProperty(scope)) {
                            test.ast = wrapper[scope](test.ast);
                        }

                        tests[storeKey] = test;
                    }
                }

                const filename = path.join(dir, fn);

                if (fs.statSync(filename).isDirectory()) {
                    return scanDir(filename);
                }

                const locator = new JsonLocator(filename);
                const origTests = require(filename);
                const tests = {};
                const errors = {};

                Object.keys(origTests).forEach(function(key) {
                    if (Array.isArray(origTests[key])) {
                        origTests[key].forEach(function(test, idx) {
                            test.name = locator.get(key, idx);
                            test.options = {
                                ...test.options,
                                context: scope
                            };
                            processTest(test, key + '#' + (idx + 1));
                        });
                    } else {
                        origTests[key].name = locator.get(key);
                        origTests[key].options = {
                            ...origTests[key].options,
                            context: scope
                        };
                        processTest(origTests[key], key);
                    }
                });

                result[filename] = {
                    scope,
                    tests,
                    errors
                };
            });
        }
    }

    scanDir(path.join(__dirname, scope));

    return result;
}, {});
