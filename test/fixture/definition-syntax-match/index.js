import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JsonLocator } from '../../helpers/JsonLocator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        const tests = JSON.parse(fs.readFileSync(filename));
        const locator = new JsonLocator(filename);

        Object.keys(tests).forEach(key => {
            tests[key].name = locator.get(key);
        });

        result[filename] = tests;
    }

    return result;
}, {});
