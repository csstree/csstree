import { createRequire } from 'module';
import patch from './data-patch.js';

const require = createRequire(import.meta.url);
const webrefCss = require('@webref/css/css.json');

// Convert @webref/css arrays to indexed objects
const webrefAtrules = {};
const webrefProperties = {};
const webrefSyntaxes = {};

for (const atrule of webrefCss.atrules) {
    // Only include at-rules that have syntax
    // At-rules without syntax can be provided by patch.json
    if (atrule.syntax) {
        webrefAtrules[atrule.name] = {
            syntax: atrule.syntax,
            descriptors: {}
        };

        if (atrule.descriptors) {
            for (const descriptor of atrule.descriptors) {
                // Only include descriptors that have syntax
                if (descriptor.syntax) {
                    webrefAtrules[atrule.name].descriptors[descriptor.name] = {
                        syntax: descriptor.syntax
                    };
                }
            }
        }
    }
}

for (const property of webrefCss.properties) {
    // Only include properties that have syntax
    // Properties without syntax can be provided by patch.json
    if (property.syntax) {
        webrefProperties[property.name] = {
            syntax: property.syntax
        };
    }
}

// Only include types that have syntax definitions
// Types without syntax in @webref/css can be provided by patch.json
for (const type of webrefCss.types) {
    if (type.syntax) {
        webrefSyntaxes[type.name] = {
            syntax: type.syntax
        };
    }
}

// Also include functions from @webref/css
// In mdn-data, functions were stored in syntaxes, but @webref/css separates them
// Only include functions that have syntax definitions
for (const func of webrefCss.functions) {
    if (func.syntax) {
        // Function names in @webref/css include parentheses (e.g., "abs()")
        webrefSyntaxes[func.name] = {
            syntax: func.syntax
        };
    }
}

const mdnAtrules = webrefAtrules;
const mdnProperties = webrefProperties;
const mdnSyntaxes = webrefSyntaxes;

const hasOwn = Object.hasOwn || ((object, property) => Object.prototype.hasOwnProperty.call(object, property));
const extendSyntax = /^\s*\|\s*/;

function preprocessAtrules(dict) {
    const result = Object.create(null);

    for (const [atruleName, atrule] of Object.entries(dict)) {
        let descriptors = null;

        if (atrule.descriptors) {
            descriptors = Object.create(null);

            for (const [name, descriptor] of Object.entries(atrule.descriptors)) {
                descriptors[name] = descriptor.syntax;
            }
        }

        let prelude = null;
        if (atrule.syntax) {
            const match = atrule.syntax.trim().replace(/\{(.|\s)+\}/, '').match(/^@\S+\s+([^;\{]*)/);
            prelude = match ? match[1].trim() || null : null;
        }

        result[atruleName.substr(1)] = {
            prelude,
            descriptors
        };
    }

    return result;
}

function patchDictionary(dict, patchDict) {
    const result = Object.create(null);

    // copy all syntaxes for an original dict
    for (const [key, value] of Object.entries(dict)) {
        if (value) {
            result[key] = value.syntax || value;
        }
    }

    // apply a patch
    for (const key of Object.keys(patchDict)) {
        if (hasOwn(dict, key)) {
            if (patchDict[key].syntax) {
                result[key] = extendSyntax.test(patchDict[key].syntax)
                    ? result[key] + ' ' + patchDict[key].syntax.trim()
                    : patchDict[key].syntax;
            } else {
                delete result[key];
            }
        } else {
            if (patchDict[key].syntax) {
                result[key] = patchDict[key].syntax.replace(extendSyntax, '');
            }
        }
    }

    return result;
}

function preprocessPatchAtrulesDescritors(declarations) {
    const result = {};

    for (const [key, value] of Object.entries(declarations || {})) {
        result[key] = typeof value === 'string'
            ? { syntax: value }
            : value;
    }

    return result;
}

function patchAtrules(dict, patchDict) {
    const result = {};

    // copy all syntaxes for an original dict
    for (const key in dict) {
        if (patchDict[key] === null) {
            continue;
        }

        const atrulePatch = patchDict[key] || {};

        result[key] = {
            prelude: key in patchDict && 'prelude' in atrulePatch
                ? atrulePatch.prelude
                : dict[key].prelude || null,
            descriptors: patchDictionary(
                dict[key].descriptors || {},
                preprocessPatchAtrulesDescritors(atrulePatch.descriptors)
            )
        };
    }

    // apply a patch
    for (const [key, atrulePatch] of Object.entries(patchDict)) {
        if (atrulePatch && !hasOwn(dict, key)) {
            result[key] = {
                prelude: atrulePatch.prelude || null,
                descriptors: atrulePatch.descriptors
                    ? patchDictionary({}, preprocessPatchAtrulesDescritors(atrulePatch.descriptors))
                    : null
            };
        }
    }

    return result;
}

export default {
    types: patchDictionary(mdnSyntaxes, patch.types),
    atrules: patchAtrules(preprocessAtrules(mdnAtrules), patch.atrules),
    properties: patchDictionary(mdnProperties, patch.properties)
};
