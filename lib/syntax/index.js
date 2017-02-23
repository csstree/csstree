var List = require('../utils/list');
var Parser = require('../parser/Parser');
var Walker = require('../walker/Walker');
var Generator = require('../generator/Generator');

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

function createNodeStructureChecker(type, fields) {
    return function checkNode(node, warn) {
        if (!node || node.constructor !== Object) {
            return warn('Type of node should be an object');
        }

        for (var key in node) {
            if (key === 'type') {
                if (node.type !== type) {
                    warn('Wrong node type `' + node.type + '` but expect `' + type + '`');
                }
            } else if (key === 'loc') {
                // TODO: check loc structure
                continue;
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
    };
}

function processStructure(name, structure) {
    var fields = {};
    var docs = {
        type: '"' + name + '"'
    };

    for (var key in structure) {
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
                docsTypes.push('<' + fieldType + '>');
            } else if (Array.isArray(fieldType)) {
                docsTypes.push('List'); // TODO: use type enum
            } else {
                throw new Error('Wrong value in `' + name + '` structure definition');
            }
        }

        docs[key] = docsTypes.join(' | ');
    }

    return {
        docs: docs,
        check: createNodeStructureChecker(name, fields)
    };
}

function createSyntax(config) {
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

    if (config.type) {
        for (var name in config.type) {
            var nodeType = config.type[name];

            parser[name] = nodeType.parse;
            generator.type[name] = nodeType.generate;
            if (typeof nodeType.walk === 'function') {
                walker.type[name] = nodeType.walk;
            }

            if (nodeType.structure) {
                lexer.structure[name] = processStructure(name, nodeType.structure);
            }
        }
    }

    // createParser(parser);
    assign(Parser.prototype, parser);
    assign(Walker.prototype, walker);
    assign(Generator.prototype, generator);
    assign(require('../lexer/Lexer').prototype, lexer); // temporary here until generator fix
}

createSyntax({
    parseContext: {
        default: 'StyleSheet',
        stylesheet: 'StyleSheet',
        atrule: 'Atrule',
        atruleExpression: function(options) {
            return this.AtruleExpression(options.atrule ? String(options.atrule) : null);
        },
        rule: 'Rule',
        selectorList: 'SelectorList',
        selector: 'Selector',
        block: function() {
            return this.Block(this.Declaration);
        },
        declarationList: 'DeclarationList',
        declaration: 'Declaration',
        value: function(options) {
            return this.Value(options.property ? String(options.property) : null);
        }
    },
    scope: {
        AtruleExpression: require('./scope/atruleExpression'),
        Selector: require('./scope/selector'),
        Value: require('./scope/value')
    },
    atrule: {
        'import': require('./atrule/import'),
        'media': require('./atrule/media'),
        'page': require('./atrule/page'),
        'supports': require('./atrule/supports')
    },
    pseudo: {
        'dir': require('./pseudo/dir'),
        'has': require('./pseudo/has'),
        'lang': require('./pseudo/lang'),
        'matches': require('./pseudo/matches'),
        'not': require('./pseudo/not'),
        'nth-child': require('./pseudo/nth-child'),
        'nth-last-child': require('./pseudo/nth-last-child'),
        'nth-last-of-type': require('./pseudo/nth-last-of-type'),
        'nth-of-type': require('./pseudo/nth-of-type'),
        'slotted': require('./pseudo/slotted')
    },
    type: {
        AnPlusB: require('./type/AnPlusB'),
        Atrule: require('./type/Atrule'),
        AtruleExpression: require('./type/AtruleExpression'),
        AttributeSelector: require('./type/AttributeSelector'),
        Block: require('./type/Block'),
        Brackets: require('./type/Brackets'),
        ClassSelector: require('./type/ClassSelector'),
        Combinator: require('./type/Combinator'),
        Comment: require('./type/Comment'),
        Declaration: require('./type/Declaration'),
        DeclarationList: require('./type/DeclarationList'),
        Dimension: require('./type/Dimension'),
        Function: require('./type/Function'),
        HexColor: require('./type/HexColor'),
        Identifier: require('./type/Identifier'),
        IdSelector: require('./type/IdSelector'),
        MediaFeature: require('./type/MediaFeature'),
        MediaQuery: require('./type/MediaQuery'),
        MediaQueryList: require('./type/MediaQueryList'),
        Nth: require('./type/Nth'),
        Number: require('./type/Number'),
        Operator: require('./type/Operator'),
        Parentheses: require('./type/Parentheses'),
        Percentage: require('./type/Percentage'),
        PseudoClassSelector: require('./type/PseudoClassSelector'),
        PseudoElementSelector: require('./type/PseudoElementSelector'),
        Ratio: require('./type/Ratio'),
        Raw: require('./type/Raw'),
        Rule: require('./type/Rule'),
        Selector: require('./type/Selector'),
        SelectorList: require('./type/SelectorList'),
        String: require('./type/String'),
        StyleSheet: require('./type/StyleSheet'),
        TypeSelector: require('./type/TypeSelector'),
        UnicodeRange: require('./type/UnicodeRange'),
        Url: require('./type/Url'),
        Value: require('./type/Value'),
        WhiteSpace: require('./type/WhiteSpace')
    }
});
