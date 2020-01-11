const hasOwnProperty = Object.prototype.hasOwnProperty;
const shape = {
    generic: true,
    types: {},
    atrules: {},
    properties: {},
    parseContext: {},
    scope: {},
    atrule: ['parse'],
    pseudo: ['parse'],
    node: ['name', 'structure', 'parse', 'generate', 'walkContext']
};

function isObject(value) {
    return value && value.constructor === Object;
}

function copy(value) {
    if (isObject(value)) {
        return { ...value };
    } else {
        return value;
    }
}
function extend(dest, src) {
    for (const key in src) {
        if (hasOwnProperty.call(src, key)) {
            if (isObject(dest[key])) {
                extend(dest[key], copy(src[key]));
            } else {
                dest[key] = copy(src[key]);
            }
        }
    }
}

function mix(dest, src, shape) {
    for (const key in shape) {
        if (hasOwnProperty.call(shape, key) === false) {
            continue;
        }

        if (shape[key] === true) {
            if (key in src) {
                if (hasOwnProperty.call(src, key)) {
                    dest[key] = copy(src[key]);
                }
            }
        } else if (shape[key]) {
            if (isObject(shape[key])) {
                const res = {};
                extend(res, dest[key]);
                extend(res, src[key]);
                dest[key] = res;
            } else if (Array.isArray(shape[key])) {
                const res = {};
                const innerShape = shape[key].reduce(function(s, k) {
                    s[k] = true;
                    return s;
                }, {});

                for (const name in dest[key]) {
                    if (hasOwnProperty.call(dest[key], name)) {
                        res[name] = {};
                        if (dest[key] && dest[key][name]) {
                            mix(res[name], dest[key][name], innerShape);
                        }
                    }
                }

                for (const name in src[key]) {
                    if (hasOwnProperty.call(src[key], name)) {
                        if (!res[name]) {
                            res[name] = {};
                        }

                        if (src[key] && src[key][name]) {
                            mix(res[name], src[key][name], innerShape);
                        }
                    }
                }
                dest[key] = res;
            }
        }
    }
    return dest;
}

module.exports = (dest, src) => mix(dest, src, shape);
