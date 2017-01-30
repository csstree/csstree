'use strict';

var Scanner = require('../scanner');

var TYPE = Scanner.TYPE;
var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var HYPHENMINUS = TYPE.HyphenMinus;

var getStyleSheet = require('./nodes/StyleSheet');
var getAtruleExpression = require('./nodes/AtruleExpression');
var getAtrule = require('./nodes/Atrule');
var getRule = require('./nodes/Rule');
var getSelectorList = require('./nodes/SelectorList');
var getSelector = require('./nodes/Selector');
var getCompoundSelector = require('./nodes/_CompoundSelector');
var getBlock = require('./nodes/Block');
var getDeclarationList = require('./nodes/DeclarationList');
var getDeclaration = require('./nodes/Declaration');
var getParentheses = require('./nodes/Parentheses');
var getDimension = require('./nodes/Dimention');
var getBrackets = require('./nodes/Brackets');
var getClass = require('./nodes/Class');
var getId = require('./nodes/Id');
var getHash = require('./nodes/Hash');
var getString = require('./nodes/String');
var getProgid = require('./nodes/Progid');
var getValue = require('./nodes/Value');
var getAttribute = require('./nodes/Attribute');
var getPercentage = require('./nodes/Percentage');
var getPseudo = require('./nodes/_Pseudo');
var getPseudoClass = require('./nodes/PseudoClass');
var getPseudoElement = require('./nodes/PseudoElement');
var getLegacyPseudoElement = require('./nodes/_LegacyPseudoElement');
var getAny = require('./nodes/_Any');
var getOperator = require('./nodes/Operator');
var getNth = require('./nodes/Nth');
var getAnPlusB = require('./nodes/An+B');
var getCombinator = require('./nodes/Combinator');
var getUrl = require('./nodes/Url');
var getUnicodeRange = require('./nodes/UnicodeRange');
var getComment = require('./nodes/Comment');
var getIdentifier = require('./nodes/Identifier');
var getFunction = require('./nodes/Function');
var getTypeOrUniversal = require('./nodes/_TypeOrUniversal');
var getRaw = require('./nodes/Raw');

function scanIdent(varAllowed) {
    // optional first -
    if (this.scanner.tokenType === HYPHENMINUS) {
        this.scanner.next();

        // variable --
        if (varAllowed && this.scanner.tokenType === HYPHENMINUS) {
            this.scanner.next();
        }
    }

    this.scanner.eat(IDENTIFIER);
}

function readIdent(varAllowed) {
    var start = this.scanner.tokenStart;

    this.scanIdent(varAllowed);

    return this.scanner.substrToCursor(start);
}

function readNumber() {
    var number = this.scanner.getTokenValue();

    this.scanner.eat(NUMBER);

    return number;
}

function readSC() {
    while (this.scanner.tokenType === WHITESPACE || this.scanner.tokenType === COMMENT) {
        this.scanner.next();
    }
}

var Parser = function() {
    this.scanner = new Scanner();
    this.needPositions = false;
    this.filename = '<unknown>';
};

Parser.prototype = {
    SPACE_NODE: { type: 'Space' },

    scopeAtruleExpression: {
        url: getUrl
    },
    scopeValue: {
        url: getUrl,
        expression: require('./functions/expression'),
        var: require('./functions/var')
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
    Stylesheet: getStyleSheet,
    AtruleExpression: getAtruleExpression,
    Atrule: getAtrule,
    Rule: getRule,
    SelectorList: getSelectorList,
    Selector: getSelector,
    CompoundSelector: getCompoundSelector,
    Block: getBlock,
    DeclarationList: getDeclarationList,
    Declaration: getDeclaration,
    Value: getValue,
    Any: getAny,
    Attribute: getAttribute,
    Parentheses: getParentheses,
    Brackets: getBrackets,
    Class: getClass,
    Id: getId,
    Combinator: getCombinator,
    Comment: getComment,
    Dimension: getDimension,
    Percentage: getPercentage,
    Function: getFunction,
    Url: getUrl,
    UnicodeRange: getUnicodeRange,
    TypeOrUniversal: getTypeOrUniversal,
    Identifier: getIdentifier,
    Nth: getNth,
    AnPlusB: getAnPlusB,
    Operator: getOperator,
    Progid: getProgid,
    Pseudo: getPseudo,
    PseudoElement: getPseudoElement,
    LegacyPseudoElement: getLegacyPseudoElement,
    PseudoClass: getPseudoClass,
    String: getString,
    Hash: getHash,
    Raw: getRaw,

    scanIdent: scanIdent,
    readIdent: readIdent,
    readNumber: readNumber,
    readSC: readSC,

    getLocation: function getLocation(start, end) {
        if (this.needPositions) {
            return this.scanner.getLocationRange(
                start,
                end,
                this.filename
            );
        }

        return null;
    },
    parse: function parse(source, options) {
        options = options || {};

        var context = options.context || 'stylesheet';
        var ast;

        this.scanner.setSource(source, options.line, options.column);
        this.filename = options.filename || '<unknown>';
        this.needPositions = Boolean(options.positions);

        if (!this.context.hasOwnProperty(context)) {
            throw new Error('Unknown context `' + context + '`');
        }

        if (context === 'value') {
            ast = this.Value(false, options.property ? String(options.property) : null);
        } else {
            ast = this.context[context].call(this);
        }

        if (!this.scanner.eof) {
            this.scanner.error();
        }

        // console.log(JSON.stringify(ast, null, 4));
        return ast;
    }
};

var parser = new Parser();

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parser.parse('a.b#c:e:Not(a):Nth-child(2n+1)::g,* b >c+d~e/deep/f,100%{v:1 2em t a(2%, var(--a)) url(..) -foo-bar !important}');

module.exports = parser.parse.bind(parser);
