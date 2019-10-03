var hasOwnProperty = Object.prototype.hasOwnProperty;

function merge() {
    var dest = {};

    for (var i = 0; i < arguments.length; i++) {
        var src = arguments[i];
        for (var key in src) {
            dest[key] = src[key];
        }
    }

    return dest;
}

var resultFilename = require('path').resolve(__dirname + '/../dist/walker-generated.js');

var config = merge(
  require('../lib/syntax/config/lexer'),
  require('../lib/syntax/config/parser'),
  require('../lib/syntax/config/walker')
);

function getWalkersFromStructure(name, nodeType) {
    var structure = nodeType.structure;
    var walkers = [];

    for (var key in structure) {
        if (hasOwnProperty.call(structure, key) === false) {
            continue;
        }

        var fieldTypes = structure[key];
        var walker = {
            name: key,
            type: false,
            nullable: false
        };

        if (!Array.isArray(structure[key])) {
            fieldTypes = [structure[key]];
        }

        for (var i = 0; i < fieldTypes.length; i++) {
            var fieldType = fieldTypes[i];
            if (fieldType === null) {
                walker.nullable = true;
            } else if (typeof fieldType === 'string') {
                walker.type = 'node';
            } else if (Array.isArray(fieldType)) {
                walker.type = 'list';
            }
        }

        if (walker.type) {
            walkers.push(walker);
        }
    }

    if (walkers.length) {
        return {
            context: nodeType.walkContext,
            fields: walkers
        };
    }

    return null;
}

function getTypesFromConfig(config) {
    var types = {};

    for (var name in config.node) {
        if (hasOwnProperty.call(config.node, name)) {
            var nodeType = config.node[name];

            if (!nodeType.structure) {
                throw new Error('Missed `structure` field in `' + name + '` node type definition');
            }

            types[name] = getWalkersFromStructure(name, nodeType);
        }
    }

    return types;
}

function indent(line) {
    return `    ` + line;
}

function createTypeIterator(name, config, reverse) {
    var fields = reverse ? config.fields.slice().reverse() : config.fields;
    var body = [];
    fields.forEach(function(field) {
        var ref = 'node.' + field.name;
        var line;

        if (field.type === 'list') {
            line = reverse
                ? ref + '.forEachRight(walk);'
                : ref + '.forEach(walk);';
        } else {
            line = 'walk(' + ref + ');';
        }

        if (field.nullable) {
            body.push(
                'if (' + ref + ') {',
                indent(line),
                '}'
            );
        } else {
            body.push(line);
        }
    });

    if (config.context) {
        body = [].concat(
            'var old = context.' + config.context + ';',
            'context.' + config.context + ' = node;',
            body,
            'context.' + config.context + ' = old;'
        );
    }

    var kind = reverse ? 'Reverse' : '';
    var func = [].concat(
        `function ${name}${kind}Iterator(node, context, walk) {`,
        body.map(function(line) {
            return indent(indent(line));
        }),
        indent('}')
    );

    return func.join('\n');
}

function createFastTraveralMap(iterators) {
    return `
    Atrule: {
        StyleSheet: ${iterators}.StyleSheet,
        Atrule: ${iterators}.Atrule,
        Rule: ${iterators}.Rule,
        Block: ${iterators}.Block
    },
    Rule: {
        StyleSheet: ${iterators}.StyleSheet,
        Atrule: ${iterators}.Atrule,
        Rule: ${iterators}.Rule,
        Block: ${iterators}.Block
    },
    Declaration: {
        StyleSheet: ${iterators}.StyleSheet,
        Atrule: ${iterators}.Atrule,
        Rule: ${iterators}.Rule,
        Block: ${iterators}.Block
    }
`;
}

function generate() {
    var types = getTypesFromConfig(config);
    var iteratorsNaturalSrc = [];
    var iteratorsReverseSrc = [];

    for (var name in types) {
        if (hasOwnProperty.call(types, name) && types[name] !== null) {
            iteratorsNaturalSrc.push(
              `    "${name}": ${createTypeIterator(name, types[name], false)},`
            );
            iteratorsReverseSrc.push(
              `    "${name}": ${createTypeIterator(name, types[name], true)},`
            );
        }
    }

    var fastTraversalIteratorsNaturalSrc = createFastTraveralMap('iteratorsNatural');
    var fastTraversalIteratorsReverseSrc = createFastTraveralMap('iteratorsReverse');

    var output = `
var types = ${JSON.stringify(types, null, 4)};

var iteratorsNatural = {
${iteratorsNaturalSrc.join('\n')}
};

var iteratorsReverse = {
${iteratorsReverseSrc.join('\n')}
};

var fastTraversalIteratorsNatural = {
${fastTraversalIteratorsNaturalSrc}
};

var fastTraversalIteratorsReverse = {
${fastTraversalIteratorsReverseSrc}
};

module.exports = {
    types: types,
    iteratorsNatural: iteratorsNatural,
    iteratorsReverse: iteratorsReverse,
    fastTraversalIteratorsNatural: fastTraversalIteratorsNatural,
    fastTraversalIteratorsReverse: fastTraversalIteratorsReverse
};`;

    console.log('Writing generated walker code to ' + resultFilename);
    require('fs').writeFileSync(
        resultFilename,
        output
    );
}

generate();
