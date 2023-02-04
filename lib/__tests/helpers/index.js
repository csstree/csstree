import { cssWideKeywords as globalValues }  from '../../lexer/generic-const.js';

export const cssWideKeywords = globalValues;

export function lazyValues(dict) {
    const result = Object.create(null);

    for (const [key, compute] of Object.entries(dict)) {
        Object.defineProperty(result, key, {
            configurable: true,
            get() {
                const value = compute.call(result);
                Object.defineProperty(result, key, { value });
                return value;
            }
        });
    }

    return result;
};
