'use strict';

var Tokenizer = require('../tokenizer');
var sequence = require('./sequence');
var getAnPlusB = require('../syntax/type/AnPlusB').parse;
var getAtrule = require('../syntax/type/Atrule').parse;
var getAtruleExpression = require('../syntax/type/AtruleExpression').parse;
var getAttributeSelector = require('../syntax/type/AttributeSelector').parse;
var getBlock = require('../syntax/type/Block').parse;
var getBrackets = require('../syntax/type/Brackets').parse;
var getClassSelector = require('../syntax/type/ClassSelector').parse;
var getCombinator = require('../syntax/type/Combinator').parse;
var getComment = require('../syntax/type/Comment').parse;
var getDeclaration = require('../syntax/type/Declaration').parse;
var getDeclarationList = require('../syntax/type/DeclarationList').parse;
var getDimension = require('../syntax/type/Dimention').parse;
var getFunction = require('../syntax/type/Function').parse;
var getHexColor = require('../syntax/type/HexColor').parse;
var getIdentifier = require('../syntax/type/Identifier').parse;
var getIdSelector = require('../syntax/type/IdSelector').parse;
var getMediaFeature = require('../syntax/type/MediaFeature').parse;
var getMediaQuery = require('../syntax/type/MediaQuery').parse;
var getMediaQueryList = require('../syntax/type/MediaQueryList').parse;
var getNth = require('../syntax/type/Nth').parse;
var getNumber = require('../syntax/type/Number').parse;
var getOperator = require('../syntax/type/Operator').parse;
var getParentheses = require('../syntax/type/Parentheses').parse;
var getPercentage = require('../syntax/type/Percentage').parse;
var getPseudoClassSelector = require('../syntax/type/PseudoClassSelector').parse;
var getPseudoElementSelector = require('../syntax/type/PseudoElementSelector').parse;
var getRatio = require('../syntax/type/Ratio').parse;
var getRaw = require('../syntax/type/Raw').parse;
var getRule = require('../syntax/type/Rule').parse;
var getSelector = require('../syntax/type/Selector').parse;
var getSelectorList = require('../syntax/type/SelectorList').parse;
var getString = require('../syntax/type/String').parse;
var getStyleSheet = require('../syntax/type/StyleSheet').parse;
var getTypeSelector = require('../syntax/type/TypeSelector').parse;
var getUnicodeRange = require('../syntax/type/UnicodeRange').parse;
var getUrl = require('../syntax/type/Url').parse;
var getValue = require('../syntax/type/Value').parse;
var getWhiteSpace = require('../syntax/type/WhiteSpace').parse;

var WHITESPACE = Tokenizer.TYPE.Whitespace;
var COMMENT = Tokenizer.TYPE.Comment;

function readSC() {
    while (this.scanner.tokenType === WHITESPACE || this.scanner.tokenType === COMMENT) {
        this.scanner.next();
    }
}

var Parser = function() {
    this.scanner = new Tokenizer();
    this.filename = '<unknown>';
    this.needPositions = false;
};

Parser.prototype = {
    scanner: null,
    filename: '<unknown>',
    needPositions: false,
    parseAtruleExpression: true,
    parseSelector: true,
    parseValue: true,
    parseCustomProperty: false,

    atrule: {
        'import': require('./atrule/import'),
        'media': require('./atrule/media'),
        'page': require('./atrule/page'),
        'supports': require('./atrule/supports')
    },
    scopeAtruleExpression: {
        getNode: require('./recognizer/atruleExpression')
    },
    scopeValue: {
        getNode: require('./recognizer/value'),
        '-moz-element': require('./function/element'),
        'element': require('./function/element'),
        'expression': require('./function/expression'),
        'var': require('./function/var')
    },
    scopeSelector: {
        getNode: require('./recognizer/selector')
    },
    pseudo: {
        'lang': sequence.singleIdentifier,
        'dir': sequence.singleIdentifier,
        'not': sequence.selectorList,
        'matches': sequence.selectorList,
        'has': sequence.selectorList,
        'nth-child': sequence.nthWithOfClause,
        'nth-last-child': sequence.nthWithOfClause,
        'nth-of-type': sequence.nth,
        'nth-last-of-type': sequence.nth,
        'slotted': sequence.compoundSelector
    },
    context: {
        stylesheet: getStyleSheet,
        atrule: getAtrule,
        atruleExpression: getAtruleExpression,
        rule: getRule,
        selectorList: getSelectorList,
        selector: getSelector,
        block: getBlock,
        declarationList: getDeclarationList,
        declaration: getDeclaration,
        value: getValue
    },

    // consumers
    AnPlusB: getAnPlusB,
    Atrule: getAtrule,
    AtruleExpression: getAtruleExpression,
    AttributeSelector: getAttributeSelector,
    Block: getBlock,
    Brackets: getBrackets,
    ClassSelector: getClassSelector,
    Combinator: getCombinator,
    Comment: getComment,
    Declaration: getDeclaration,
    DeclarationList: getDeclarationList,
    Dimension: getDimension,
    Function: getFunction,
    HexColor: getHexColor,
    Identifier: getIdentifier,
    IdSelector: getIdSelector,
    MediaFeature: getMediaFeature,
    MediaQuery: getMediaQuery,
    MediaQueryList: getMediaQueryList,
    Nth: getNth,
    Number: getNumber,
    Operator: getOperator,
    Parentheses: getParentheses,
    Percentage: getPercentage,
    PseudoClassSelector: getPseudoClassSelector,
    PseudoElementSelector: getPseudoElementSelector,
    Ratio: getRatio,
    Raw: getRaw,
    Rule: getRule,
    Selector: getSelector,
    SelectorList: getSelectorList,
    String: getString,
    StyleSheet: getStyleSheet,
    TypeSelector: getTypeSelector,
    UnicodeRange: getUnicodeRange,
    Url: getUrl,
    Value: getValue,
    WhiteSpace: getWhiteSpace,

    readSC: readSC,
    readSequence: sequence.default,

    getLocation: function(start, end) {
        if (this.needPositions) {
            return this.scanner.getLocationRange(
                start,
                end,
                this.filename
            );
        }

        return null;
    },
    getLocationFromList: function(list) {
        if (this.needPositions) {
            return this.scanner.getLocationRange(
                list.head !== null ? list.first().loc.start.offset - this.scanner.startOffset : this.scanner.tokenStart,
                list.head !== null ? list.last().loc.end.offset - this.scanner.startOffset : this.scanner.tokenStart,
                this.filename
            );
        }

        return null;
    },

    parse: function(source, options) {
        options = options || {};

        var context = options.context || 'stylesheet';
        var ast;

        this.scanner.setSource(source, options.offset, options.line, options.column);
        this.filename = options.filename || '<unknown>';
        this.needPositions = Boolean(options.positions);
        this.parseAtruleExpression = 'parseAtruleExpression' in options ? Boolean(options.parseAtruleExpression) : true;
        this.parseSelector = 'parseSelector' in options ? Boolean(options.parseSelector) : true;
        this.parseValue = 'parseValue' in options ? Boolean(options.parseValue) : true;
        this.parseCustomProperty = 'parseCustomProperty' in options ? Boolean(options.parseCustomProperty) : false;

        switch (context) {
            case 'value':
                ast = this.Value(options.property ? String(options.property) : null);
                break;

            case 'atruleExpression':
                ast = this.AtruleExpression(options.atrule ? String(options.atrule) : null);
                break;

            default:
                if (!this.context.hasOwnProperty(context)) {
                    throw new Error('Unknown context `' + context + '`');
                }

                ast = this.context[context].call(this);
        }

        if (!this.scanner.eof) {
            this.scanner.error();
        }

        // console.log(JSON.stringify(ast, null, 4));
        return ast;
    }
};

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
new Parser().parse(
    'a.b#c:e:Not(a/**/):AFTER:Nth-child(2n+1)::g::slotted(a/**/),* b >c+d~e/deep/f,100%{' +
    'v:U+123 1 2em t a(2%, var(--a)) -b() url(..) -foo-bar !important}'
);

module.exports = Parser;
