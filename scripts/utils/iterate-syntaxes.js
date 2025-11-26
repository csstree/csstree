import { createRequire } from 'module';
import csstreeData from '../../lib/data.js';

const require = createRequire(import.meta.url);
const webrefCss = require('@webref/css/css.json');

// Convert @webref/css arrays to indexed objects for easier access
const data = {
    atRules: {},
    properties: {},
    syntaxes: {}
};

for (const atrule of webrefCss.atrules) {
    // Only include at-rules that have syntax
    if (atrule.syntax) {
        data.atRules[atrule.name] = {
            syntax: atrule.syntax
        };

        if (atrule.descriptors) {
            data.atRules[atrule.name].descriptors = {};
            for (const descriptor of atrule.descriptors) {
                // Only include descriptors that have syntax
                if (descriptor.syntax) {
                    data.atRules[atrule.name].descriptors[descriptor.name] = {
                        syntax: descriptor.syntax
                    };
                }
            }
        }
    }
}

for (const property of webrefCss.properties) {
    // Only include properties that have syntax
    if (property.syntax) {
        data.properties[property.name] = {
            syntax: property.syntax
        };
    }
}

// Only include types that have syntax definitions
// Types without syntax in @webref/css can be provided by patch.json
for (const type of webrefCss.types) {
    if (type.syntax) {
        data.syntaxes[type.name] = {
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
        data.syntaxes[func.name] = {
            syntax: func.syntax
        };
    }
}

export default function iterateSyntaxes(fn) {
    for (const name in data.atRules) {
        fn('webref/atRules', name, data.atRules[name].syntax);
        for (const descriptor in data.atRules[name].descriptors) {
            fn('webref/atRules/' + name, descriptor, data.atRules[name].descriptors[descriptor].syntax);
        }
    }

    for (const name in data.properties) {
        fn('webref/properties', name, data.properties[name].syntax);
    }

    for (const name in data.syntaxes) {
        fn('webref/syntaxes', name, data.syntaxes[name].syntax);
    }

    ['properties', 'types'].forEach(function(section) {
        Object.keys(csstreeData[section]).forEach(function(name) {
            const csstreeSyntax = csstreeData[section][name];
            const webrefData = data[section === 'properties' ? 'properties' : 'syntaxes'][name];
            if (!webrefData || csstreeSyntax !== webrefData.syntax) {
                fn('csstree/' + section, name, csstreeSyntax);
            }
        });
    });
};
