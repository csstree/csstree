import fs from 'fs';
import url from 'url';
import path from 'path';
import { createRequire } from 'module';
import JsonLocator from '../../helpers/JsonLocator.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function forEachTest(factory) {
    for (const filename in tests) {
        const file = tests[filename];

        for (const key in file) {
            factory(key, file[key]);
        }
    };
}

export const tests = fs.readdirSync(__dirname).reduce((result, fn) => {
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
