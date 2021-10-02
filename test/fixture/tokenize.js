import fs from 'fs';
import path from 'path';
import { JsonLocator } from '../helpers/JsonLocator.js';

const __dirname = 'fixtures/tokenize';

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
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

export function forEachTest(testType, factory) {
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

export const tests = fs.readdirSync(__dirname).reduce(function(result, filename) {
    const absFilename = path.join(__dirname, filename);

    if (path.extname(filename) !== '.json' || fs.statSync(absFilename).isDirectory()) {
        return result;
    }

    const locator = new JsonLocator(absFilename);
    const tests = JSON.parse(fs.readFileSync(absFilename));
    const type = path.basename(filename, '.json');

    result[filename] = {
        type,
        valid: processTests(tests, 'valid', type, locator),
        invalid: processTests(tests, 'invalid', type, locator)
    };

    return result;
}, {});
