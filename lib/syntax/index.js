var hasOwnProperty = Object.prototype.hasOwnProperty;
var List = require('../utils/list');
var createParser = require('../parser');
var Generator = require('../generator/Generator');
var createConvertors = require('../utils/convert');
var createWalker = require('../walker');
var names = require('../utils/names');

function assign(dest, src) {
    for (var key in src) {
        dest[key] = src[key];
    }

    return dest;
}

function createParseContext(name) {
    return function() {
        return this[name]();
    };
}

function isValidNumber(value) {
    // Number.isInteger(value) && value >= 0
    return (
        typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value &&
        value >= 0
    );
}

function isValidLocation(loc) {
    return (
        Boolean(loc) &&
        isValidNumber(loc.offset) &&
        isValidNumber(loc.line) &&
        isValidNumber(loc.column)
    );
}

function createNodeStructureChecker(type, fields) {
    return function checkNode(node, warn) {
        if (!node || node.constructor !== Object) {
            return warn('Type of node should be an object');
        }

        for (var key in node) {
            if (key === 'type') {
                if (node.type !== type) {
                    warn('Wrong node type `' + node.type + '` but expected `' + type + '`');
                }
            } else if (key === 'loc') {
                if (node.loc === null) {
                    continue;
                } else if (node.loc && node.loc.constructor === Object) {
                    if (typeof node.loc.source === 'string' &&
                        isValidLocation(node.loc.start) &&
                        isValidLocation(node.loc.end)) {
                        continue;
                    }
                }
                warn('Wrong value for `' + type + '.' + key + '` field');
            } else if (fields.hasOwnProperty(key)) {
                for (var i = 0, valid = false; !valid && i < fields[key].length; i++) {
                    var fieldType = fields[key][i];

                    switch (fieldType) {
                        case String:
                            valid = typeof node[key] === 'string';
                            break;

                        case Boolean:
                            valid = typeof node[key] === 'boolean';
                            break;

                        case null:
                            valid = node[key] === null;
                            break;

                        default:
                            if (typeof fieldType === 'string') {
                                valid = node[key] && node[key].type === fieldType;
                            } else if (Array.isArray(fieldType)) {
                                valid = node[key] instanceof List;
                            }
                    }
                }
                if (!valid) {
                    warn('Wrong value for `' + type + '.' + key + '` field');
                }
            } else {
                warn('Unknown field `' + key + '` for ' + type);
            }
        }

        for (var key in fields) {
            if (hasOwnProperty.call(node, key) === false) {
                warn('Field `' + type + '.' + key + '` is missed');
            }
        }
    };
}

function createNodeWalker(fields, context) {
    if (!fields.length) {
        return null;
    }

    return (
        (context ? 'var old = context.' + context + ';\ncontext.' + context + ' = node;\n' : '') +
        fields.join('\n') +
        (context ? '\ncontext.' + context + ' = old;' : '')
    );
}

function processStructure(name, nodeType) {
    var structure = nodeType.structure;
    var fields = {
        type: String,
        loc: true
    };
    var walkers = [];
    var docs = {
        type: '"' + name + '"'
    };

    for (var key in structure) {
        var walker = null;
        var docsTypes = [];
        var fieldTypes = fields[key] = Array.isArray(structure[key])
            ? structure[key].slice()
            : [structure[key]];

        for (var i = 0; i < fieldTypes.length; i++) {
            var fieldType = fieldTypes[i];
            if (fieldType === String || fieldType === Boolean) {
                docsTypes.push(fieldType.name);
            } else if (fieldType === null) {
                docsTypes.push('null');
            } else if (typeof fieldType === 'string') {
                walker = 'walk(node.' + key + ');';
                docsTypes.push('<' + fieldType + '>');
            } else if (Array.isArray(fieldType)) {
                walker = 'node.' + key + '.each(walk);';
                docsTypes.push('List'); // TODO: use type enum
            } else {
                throw new Error('Wrong value in `' + name + '` structure definition');
            }
        }

        docs[key] = docsTypes.join(' | ');
        if (walker !== null) {
            if (docsTypes.indexOf('null') !== -1) {
                walker = 'if (node.' + key + ' !== null) {\n  ' + walker + '\n}';
            }
            walkers.push(walker);
        }
    }

    return {
        docs: docs,
        check: createNodeStructureChecker(name, fields),
        walk: createNodeWalker(walkers, nodeType.walkContext)
    };
}

exports.create = function createSyntax(config) {
    var parser = { context: {}, scope: {}, atrule: {}, pseudo: {} };
    var walker = { type: {} };
    var generator = { type: {} };
    var lexer = { structure: {} };

    if (config.parseContext) {
        for (var name in config.parseContext) {
            switch (typeof config.parseContext[name]) {
                case 'function':
                    parser.context[name] = config.parseContext[name];
                    break;

                case 'string':
                    parser.context[name] = createParseContext(config.parseContext[name]);
                    break;
            }
        }
    }

    if (config.scope) {
        for (var name in config.scope) {
            parser.scope[name] = config.scope[name];
        }
    }

    if (config.atrule) {
        for (var name in config.atrule) {
            var atrule = config.atrule[name];

            if (atrule.parse) {
                parser.atrule[name] = atrule.parse;
            }
        }
    }

    if (config.pseudo) {
        for (var name in config.pseudo) {
            var pseudo = config.pseudo[name];

            if (pseudo.parse) {
                parser.pseudo[name] = pseudo.parse;
            }
        }
    }

    if (config.node) {
        for (var name in config.node) {
            var nodeType = config.node[name];

            parser[name] = nodeType.parse;
            generator.type[name] = nodeType.generate;

            if (nodeType.structure) {
                var structure = processStructure(name, nodeType);
                lexer.structure[name] = {
                    docs: structure.docs,
                    check: structure.check
                };
                if (structure.walk) {
                    walker.type[name] = structure.walk;
                }
            } else {
                throw new Error('Missed `structure` field in `' + name + '` node type definition');
            }
        }
    }

    var parse = createParser(parser);
    assign(Generator.prototype, generator);
    var Lexer = require('../lexer/Lexer');
    assign(Lexer.prototype, lexer); // temporary here until generator fix

    var walker = createWalker(walker.type);
    var convertors = createConvertors(walker);
    var lexer = new Lexer({
        generic: true,
        types: config.types,
        properties: config.properties
    }, walker);

    return {
        List: require('../utils/list'),
        Tokenizer: require('../tokenizer'),
        Lexer: require('../lexer/Lexer'),

        syntax: require('../lexer'),
        defaultLexer: lexer,
        createSyntax: function(config) {
            return new Lexer(config, walker);
        },

        property: names.property,
        keyword: names.keyword,

        parse: parse,
        clone: require('../utils/clone'),
        fromPlainObject: convertors.fromPlainObject,
        toPlainObject: convertors.toPlainObject,

        walk: walker.all,
        walkUp: walker.allUp,
        walkRules: walker.rules,
        walkRulesRight: walker.rulesRight,
        walkDeclarations: walker.declarations,

        translate: require('../generator').translate,
        translateWithSourceMap: require('../generator').translateWithSourceMap
    };
};
