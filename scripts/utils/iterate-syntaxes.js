import data from 'mdn-data/css/index.js';
import csstreeData from '../../lib/data.js';

export default function iterateSyntaxes(fn) {
    for (const name in data.atRules) {
        fn('mdn/atRules', name, data.atRules[name].syntax);
        for (const descriptor in data.atRules[name].descriptors) {
            fn('mdn/atRules/' + name, descriptor, data.atRules[name].descriptors[descriptor].syntax);
        }
    }

    for (const name in data.properties) {
        fn('mdn/properties', name, data.properties[name].syntax);
    }

    for (const name in data.syntaxes) {
        fn('mdn/syntaxes', name, data.syntaxes[name].syntax);
    }

    ['properties', 'types'].forEach(function(section) {
        Object.keys(csstreeData[section]).forEach(function(name) {
            const csstreeSyntax = csstreeData[section][name];
            const mdnData = data[section === 'properties' ? 'properties' : 'syntaxes'][name];
            if (!mdnData || csstreeSyntax !== mdnData.syntax) {
                fn('csstree/' + section, name, csstreeSyntax);
            }
        });
    });
};
