import * as csstree from '@eslint/css-tree';

// Basic parsing and generating
const ast = csstree.parse('.example { color: red }');
const css = csstree.generate(ast);

// Parsing with options
const astWithOpts = csstree.parse('.example { color: red }', {
    context: 'stylesheet',
    positions: true,
    onComment(value, loc) {
        console.log(value, loc.start.line, loc.start.column);
    },
    onParseError(error, fallbackNode) {
        console.log(error.message, fallbackNode.type);
    },
    onToken(type, start, end, index) {
        switch (type) {
            case csstree.tokenTypes.BadString:
                console.warn('Bad string', this.getRangeLocation(start, end));
                break;

            case csstree.tokenTypes.BadUrl:
                console.warn('Bad url', this.getRangeLocation(start, end));
                break;

            default:
                if (this.isBlockOpenerTokenType(type)) {
                    if (this.getBlockTokenPairIndex(index) === -1) {
                        console.warn('No closing pair', this.getRangeLocation(start, end));
                    }
                } else if (this.isBlockCloserTokenType(type)) {
                    if (this.getBlockTokenPairIndex(index) === -1) {
                        console.warn('No opening pair', this.getRangeLocation(start, end));
                    }
                }
        }
    }
});

const error1 = new csstree.parse.SyntaxError('Unexpected token', 'x', 0, 1, 1);
const error2 = new csstree.parse.SyntaxError('Unexpected token', 'x', 0, 1, 1, 4);
const error3 = new csstree.parse.SyntaxError('Unexpected token', 'x', 0, 1, 1, 4, 5);

// Walking the AST
csstree.walk(ast, {
    visit: 'Declaration',
    enter: (node, item, list) => {
        if (node.type === 'Declaration') {
            console.log(node.property);
        }
    }
});

// Finding nodes
const declaration = csstree.find(ast, (node) => {
    return node.type === 'Declaration' && node.property === 'color';
});

declaration satisfies csstree.CssNode | null;

const declarations = csstree.findAll(ast, (node) => {
    return node.type === 'Declaration';
});

declarations satisfies csstree.CssNode[];

// List manipulation
const list = new csstree.List<csstree.CssNode>();
list.appendData({ type: 'WhiteSpace', value: ' ' });
list.prependData({ type: 'Identifier', name: 'test' });

// Node creation and manipulation
const selector: csstree.Selector = {
    type: 'Selector',
    children: new csstree.List<csstree.CssNode>()
};

const rule: csstree.Rule = {
    type: 'Rule',
    prelude: {
        type: 'SelectorList',
        children: new csstree.List<csstree.CssNode>()
    },
    block: {
        type: 'Block',
        children: new csstree.List<csstree.CssNode>()
    }
};

// Lexer usage
const lexer = new csstree.Lexer({
    generic: true,
    types: {},
    properties: {},
    atrules: {},
    units: {},
    scope: {},
    features: {},
    node: {},
    atrule: {},
    pseudo: {},
    parseContext: {
        default: 'stylesheet'
    }
});

// Property matching
const propertyMatch = lexer.matchProperty('color', 'red');
console.log(propertyMatch.matched?.type);
console.log(propertyMatch.isType(ast, 'color'));

// Value fragment finding
const fragments = lexer.findValueFragments('border', {
    type: 'Value',
    children: new csstree.List<csstree.CssNode>()
}, 'Type', 'length');

// TokenStream usage
const tokenStream = new csstree.TokenStream('div { color: red }', csstree.tokenize);
while (!tokenStream.eof) {
    tokenStream.next();
    console.log(tokenStream.tokenType);
}

// Definition syntax
const syntax = csstree.definitionSyntax.parse('<color> | <length>');
csstree.definitionSyntax.generate(syntax);
csstree.definitionSyntax.walk(syntax, {
    enter: (node) => {
        console.log(node.type);
    }
});


// String encoding/decoding
const encodedStr = csstree.string.encode('test"string');
const decodedStr = csstree.string.decode(encodedStr);

// URL encoding/decoding
const encodedUrl = csstree.url.encode('http://example.com/?q=test');
const decodedUrl = csstree.url.decode(encodedUrl);

// Identifier handling
const encodedIdent = csstree.ident.encode('test-ident');
const decodedIdent = csstree.ident.decode(encodedIdent);

// Property parsing
const parsedProp = csstree.property('--custom-property');
console.log(parsedProp.basename, parsedProp.custom);

// Keyword parsing
const parsedKeyword = csstree.keyword('-webkit-flex');
console.log(parsedKeyword.basename, parsedKeyword.vendor);

// Forking the AST
const forkedAst = csstree.fork({
    parseContext: {
        default: 'stylesheet'
    }
}).parse('.example { color: blue }');

const forkedCss = csstree.generate(forkedAst);
console.log(forkedCss);

// Forking with custom syntax
const customSyntax = csstree.fork({
    parseContext: {
        default: 'stylesheet'
    },
    atrules: {
        CustomAtRule: {
            prelude: 'CustomAtRule',
            descriptors: {
                custom: 'CustomNode'
            }

        }
    },
    properties: {
        custom: 'CustomNode'
    }
});

const customAst = customSyntax.parse('.example { custom: value }');
customSyntax.walk(customAst,
    (node) => {
        if (node.type === 'AttributeSelector') {
            console.log(node.name, node.value);
        }
    }
);
