var Parser = require('../parser/Parser');
var Walker = require('../walker/Walker');
var Generator = require('../generator/Generator');

function createParseContext(name) {
    return function() {
        return this[name]();
    };
}

function createSyntax(config) {
    var parser = { context: {}, scope: {}, atrule: {}, pseudo: {} };
    var walker = { type: {} };
    var generator = { type: {} };

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
        }
    }

    // createParser(parser);
    Object.assign(Parser.prototype, parser);
    Object.assign(Walker.prototype, walker);
    Object.assign(Generator.prototype, generator);
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
