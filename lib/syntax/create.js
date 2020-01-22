const List = require('../common/List');
const TokenStream = require('../common/TokenStream');
const Lexer = require('../lexer/Lexer');
const definitionSyntax = require('../definition-syntax');
const tokenize = require('../tokenizer');
const createParser = require('../parser/create');
const createGenerator = require('../generator/create');
const createConvertor = require('../convertor/create');
const createWalker = require('../walker/create');
const clone = require('../utils/clone');
const names = require('../utils/names');
const mix = require('./config/mix');
const ident = require('../utils/ident');
const string = require('../utils/string');
const url = require('../utils/url');

function createSyntax(config) {
    const parse = createParser(config);
    const walk = createWalker(config);
    const generate = createGenerator(config);
    const { fromPlainObject, toPlainObject } = createConvertor(walk);

    const syntax = {
        List,
        TokenStream,
        Lexer,

        vendorPrefix: names.vendorPrefix,
        keyword: names.keyword,
        property: names.property,
        isCustomProperty: names.isCustomProperty,
        ident,
        string,
        url,

        definitionSyntax,
        lexer: null,
        createLexer: config => new Lexer(config, syntax, syntax.lexer.structure),

        tokenize,
        parse,
        walk,
        generate,

        find: walk.find,
        findLast: walk.findLast,
        findAll: walk.findAll,

        clone,
        fromPlainObject,
        toPlainObject,

        createSyntax: function(config) {
            return createSyntax(mix({}, config));
        },
        fork: function(extension) {
            const base = mix({}, config); // copy of config
            return createSyntax(
                typeof extension === 'function'
                    ? extension(base, Object.assign)
                    : mix(base, extension)
            );
        }
    };

    syntax.lexer = new Lexer({
        generic: true,
        types: config.types,
        atrules: config.atrules,
        properties: config.properties,
        node: config.node
    }, syntax);

    return syntax;
};

exports.create = config => createSyntax(mix({}, config));
