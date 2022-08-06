export const cssWideKeywords = [
    'unset',
    'initial',
    'inherit',
    'revert',
    'revert-layer'
];

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
