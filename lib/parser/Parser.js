'use strict';

var Tokenizer = require('../tokenizer');

var TYPE = Tokenizer.TYPE;
var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;

var sequence = require('./sequence');
var getAnPlusB = require('./type/An+B');
var getAtrule = require('./type/Atrule');
var getAtruleExpression = require('./type/AtruleExpression');
var getAttribute = require('./type/Attribute');
var getBlock = require('./type/Block');
var getBrackets = require('./type/Brackets');
var getClassSelector = require('./type/ClassSelector');
var getCombinator = require('./type/Combinator');
var getComment = require('./type/Comment');
var getDeclaration = require('./type/Declaration');
var getDeclarationList = require('./type/DeclarationList');
var getDimension = require('./type/Dimention');
var getFunction = require('./type/Function');
var getHash = require('./type/Hash');
var getIdSelector = require('./type/IdSelector');
var getIdentifier = require('./type/Identifier');
var getMediaFeature = require('./type/MediaFeature');
var getMediaQuery = require('./type/MediaQuery');
var getMediaQueryList = require('./type/MediaQueryList');
var getNth = require('./type/Nth');
var getNumber = require('./type/Number');
var getOperator = require('./type/Operator');
var getParentheses = require('./type/Parentheses');
var getPercentage = require('./type/Percentage');
var getProgid = require('./type/Progid');
var getPseudoClass = require('./type/PseudoClass');
var getPseudoElement = require('./type/PseudoElement');
var getRatio = require('./type/Ratio');
var getRaw = require('./type/Raw');
var getRule = require('./type/Rule');
var getSelector = require('./type/Selector');
var getSelectorList = require('./type/SelectorList');
var getSpace = require('./type/Space');
var getString = require('./type/String');
var getStyleSheet = require('./type/StyleSheet');
var getType = require('./type/Type');
var getUnicodeRange = require('./type/UnicodeRange');
var getUrl = require('./type/Url');
var getValue = require('./type/Value');

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

    scopeAtruleExpression: {},
    scopeValue: {
        '-moz-element': require('./function/element'),
        'element': require('./function/element'),
        'expression': require('./function/expression'),
        'var': require('./function/var')
    },
    atrule: {
        'import': require('./atrule/import'),
        'media': require('./atrule/media'),
        'page': require('./atrule/page'),
        'supports': require('./atrule/supports')
    },
    pseudo: {
        'lang': sequence.singleIdentifier,
        'dir': sequence.singleIdentifier,
        'not': sequence.selectorList,
        'matches': sequence.selectorList,
        'has': sequence.relativeSelectorList,
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
    Attribute: getAttribute,
    Block: getBlock,
    Brackets: getBrackets,
    ClassSelector: getClassSelector,
    Combinator: getCombinator,
    Comment: getComment,
    Declaration: getDeclaration,
    DeclarationList: getDeclarationList,
    Dimension: getDimension,
    Function: getFunction,
    Hash: getHash,
    IdSelector: getIdSelector,
    Identifier: getIdentifier,
    MediaFeature: getMediaFeature,
    MediaQuery: getMediaQuery,
    MediaQueryList: getMediaQueryList,
    Nth: getNth,
    Number: getNumber,
    Operator: getOperator,
    Parentheses: getParentheses,
    Percentage: getPercentage,
    Progid: getProgid,
    PseudoClass: getPseudoClass,
    PseudoElement: getPseudoElement,
    Ratio: getRatio,
    Raw: getRaw,
    Rule: getRule,
    Selector: getSelector,
    SelectorList: getSelectorList,
    Space: getSpace,
    String: getString,
    StyleSheet: getStyleSheet,
    Type: getType,
    UnicodeRange: getUnicodeRange,
    Url: getUrl,
    Value: getValue,

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
                list.head !== null ? list.first().loc.start.offset : this.scanner.tokenStart,
                list.head !== null ? list.last().loc.end.offset : this.scanner.tokenStart,
                this.filename
            );
        }

        return null;
    },

    parse: function(source, options) {
        options = options || {};

        var context = options.context || 'stylesheet';
        var ast;

        this.scanner.setSource(source, options.line, options.column);
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
