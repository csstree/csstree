'use strict';

var TokenType = require('./const').TokenType;
var Scanner = require('./scanner');
var List = require('../utils/list');
var cmpChar = require('./utils').cmpChar;
var cmpStr = require('./utils').cmpStr;
var endsWith = require('./utils').endsWith;
var isHex = require('./utils').isHex;
var needPositions;
var filename;
var scanner;

var DESCENDANT_COMBINATOR = {};
var SPACE_NODE = { type: 'Space' };

var WHITESPACE = TokenType.Whitespace;
var IDENTIFIER = TokenType.Identifier;
var NUMBER = TokenType.Number;
var STRING = TokenType.String;
var COMMENT = TokenType.Comment;
var EXCLAMATIONMARK = TokenType.ExclamationMark;
var NUMBERSIGN = TokenType.NumberSign;
var DOLLARSIGN = TokenType.DollarSign;
var PERCENTSIGN = TokenType.PercentSign;
var LEFTPARENTHESIS = TokenType.LeftParenthesis;
var RIGHTPARENTHESIS = TokenType.RightParenthesis;
var ASTERISK = TokenType.Asterisk;
var PLUSSIGN = TokenType.PlusSign;
var COMMA = TokenType.Comma;
var HYPHENMINUS = TokenType.HyphenMinus;
var FULLSTOP = TokenType.FullStop;
var SOLIDUS = TokenType.Solidus;
var COLON = TokenType.Colon;
var SEMICOLON = TokenType.Semicolon;
var EQUALSSIGN = TokenType.EqualsSign;
var GREATERTHANSIGN = TokenType.GreaterThanSign;
var QUESTIONMARK = TokenType.QuestionMark;
var COMMERCIALAT = TokenType.CommercialAt;
var LEFTSQUAREBRACKET = TokenType.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TokenType.RightSquareBracket;
var CIRCUMFLEXACCENT = TokenType.CircumflexAccent;
var LEFTCURLYBRACKET = TokenType.LeftCurlyBracket;
var VERTICALLINE = TokenType.VerticalLine;
var RIGHTCURLYBRACKET = TokenType.RightCurlyBracket;
var TILDE = TokenType.Tilde;
var N = 110; // 'n'.charCodeAt(0)

var SCOPE_ATRULE_EXPRESSION = {
    url: getUri
};
var SCOPE_SELECTOR = {
    url: getUri,
    not: getNotFunction
};
var SCOPE_VALUE = {
    url: getUri,
    expression: getOldIEExpression,
    var: getVarFunction
};

var initialContext = {
    stylesheet: getStylesheet,
    atrule: getAtrule,
    atruleExpression: getAtruleExpression,
    rule: getRule,
    selector: getSelector,
    simpleSelector: getSimpleSelector,
    block: getBlock,
    declaration: getDeclaration,
    value: getValue
};

function isNumber(code) {
    return code >= 48 && code <= 57;
}

function getInfo(start) {
    if (needPositions) {
        return scanner.getLocation(
            start !== undefined ? start : scanner.tokenStart,
            filename
        );
    }

    return null;
}

function getStylesheet(nested) {
    var start = scanner.tokenStart;
    var rules = new List();
    var child;

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case WHITESPACE:
                scanner.next();
                continue;

            case RIGHTCURLYBRACKET:
                if (!nested) {
                    scanner.error('Unexpected right curly brace');
                }

                break scan;

            case COMMENT:
                // ignore comments except exclamation comments (i.e. /*! .. */) on top level
                if (nested || scanner.source.charCodeAt(scanner.tokenStart + 2) !== EXCLAMATIONMARK) {
                    scanner.next();
                    continue;
                }

                child = getComment();
                break;

            case COMMERCIALAT:
                child = getAtrule();
                break;

            default:
                child = getRule();
        }

        rules.appendData(child);
    }

    return {
        type: 'StyleSheet',
        info: getInfo(start),
        rules: rules
    };
}

function isBlockAtrule() {
    for (var offset = 1, type; type = scanner.lookupType(offset); offset++) {
        if (type === RIGHTCURLYBRACKET) {
            return true;
        }

        if (type === LEFTCURLYBRACKET ||
            type === COMMERCIALAT) {
            return false;
        }
    }

    return true;
}

function getAtruleExpression() {
    var start = scanner.tokenStart;
    var sequence = new List();
    var wasSpace = false;
    var child;

    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case SEMICOLON:
            case LEFTCURLYBRACKET:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                scanner.next();
                continue;

            case COMMENT: // ignore comments
                scanner.next();
                continue;

            case COMMA:
                child = getOperator();
                break;

            case COLON:
                child = getPseudo();
                break;

            case LEFTPARENTHESIS:
                child = getParentheses(SCOPE_ATRULE_EXPRESSION);
                break;

            case STRING:
                child = getString();
                break;

            default:
                child = getAny(SCOPE_ATRULE_EXPRESSION);
        }

        if (wasSpace) {
            wasSpace = false;
            sequence.appendData(SPACE_NODE);
        }

        sequence.appendData(child);
    }

    return {
        type: 'AtruleExpression',
        info: getInfo(start),
        sequence: sequence
    };
}

function getAtrule() {
    scanner.eat(COMMERCIALAT);

    var node = {
        type: 'Atrule',
        info: getInfo(),
        name: readIdent(false),
        expression: getAtruleExpression(),
        block: null
    };

    switch (scanner.tokenType) {
        case SEMICOLON:
            scanner.next();  // ;
            break;

        case LEFTCURLYBRACKET:
            scanner.next();  // {

            node.block = isBlockAtrule()
                ? getBlock()
                : getStylesheet(true);

            scanner.eat(RIGHTCURLYBRACKET);
            break;

        // at-rule expression can ends with semicolon, left curly bracket or eof - no other options
    }

    return node;
}

function getRule() {
    var node = {
        type: 'Rule',
        info: getInfo(),
        selector: getSelector(),
        block: null
    };

    scanner.eat(LEFTCURLYBRACKET);
    node.block = getBlock();
    scanner.eat(RIGHTCURLYBRACKET);

    return node;
}

function getSelector() {
    var start = scanner.tokenStart;
    var selectors = new List();
    var simpleSelector;
    var lastComma = -2;

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case LEFTCURLYBRACKET:
                break scan;

            case COMMA:
                if (lastComma !== -1) {
                    scanner.error('Unexpected comma');
                }

                lastComma = scanner.tokenStart;
                scanner.next();
                break;

            default:
                lastComma = -1;
                simpleSelector = getSimpleSelector();
                selectors.appendData(simpleSelector);

                if (simpleSelector.sequence.isEmpty()) {
                    scanner.error('Simple selector expected');
                }
        }
    }

    if (lastComma !== -1 && lastComma !== -2) { // TODO: fail on empty selector rules?
        scanner.error('Unexpected trailing comma', lastComma);
    }

    return {
        type: 'Selector',
        info: getInfo(start),
        selectors: selectors
    };
}

function getSimpleSelector(nested) {
    var start = scanner.tokenStart;
    var sequence = new List();
    var combinator = null;
    var combinatorOffset = -1;
    var child;

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case COMMA:
                break scan;

            case LEFTCURLYBRACKET:
                if (nested) {
                    scanner.error();
                }

                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    scanner.error();
                }

                break scan;

            case COMMENT:
                scanner.next();
                continue;

            case WHITESPACE:
                if (combinator === null && sequence.head !== null) {
                    combinatorOffset = scanner.tokenStart;
                    combinator = DESCENDANT_COMBINATOR;
                } else {
                    scanner.next();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
            case SOLIDUS:
                if ((sequence.head === null) || // combinator in the beginning
                    (combinator !== null && combinator !== DESCENDANT_COMBINATOR)) {
                    scanner.error('Unexpected combinator');
                }

                combinatorOffset = scanner.tokenStart;
                combinator = getCombinator();
                continue;

            case FULLSTOP:
                child = getClass();
                break;

            case LEFTSQUAREBRACKET:
                child = getAttribute();
                break;

            case NUMBERSIGN:
                child = getId();
                break;

            case COLON:
                child = getPseudo();
                break;

            case HYPHENMINUS:
            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                child = getTypeOrUniversal();
                break;

            case NUMBER:
                child = getPercentage();
                break;

            default:
                scanner.error();
        }

        if (combinator !== null) {
            // create descendant combinator on demand to avoid garbage
            if (combinator === DESCENDANT_COMBINATOR) {
                combinator = {
                    type: 'Combinator',
                    info: getInfo(combinatorOffset),
                    name: ' '
                };
            }

            sequence.appendData(combinator);
            combinator = null;
        }

        sequence.appendData(child);
    }

    if (combinator !== null && combinator !== DESCENDANT_COMBINATOR) {
        scanner.error('Unexpected combinator', combinatorOffset);
    }

    return {
        type: 'SimpleSelector',
        info: getInfo(start),
        sequence: sequence
    };
}

function getBlock() {
    var start = scanner.tokenStart;
    var declarations = new List();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTCURLYBRACKET:
                break scan;

            case WHITESPACE:
            case COMMENT:
            case SEMICOLON:
                scanner.next();
                break;

            default:
                declarations.appendData(getDeclaration());
        }
    }

    return {
        type: 'Block',
        info: getInfo(start),
        declarations: declarations
    };
}

function getDeclaration(nested) {
    var start = scanner.tokenStart;
    var property = readProperty();
    var important = false;
    var value;

    readSC();
    scanner.eat(COLON);
    value = getValue(nested, property);

    if (scanner.tokenType === EXCLAMATIONMARK) {
        important = getImportant();
    }

    return {
        type: 'Declaration',
        info: getInfo(start),
        important: important,
        property: property,
        value: value
    };
}

function readProperty() {
    var start = scanner.tokenStart;
    var type;

    for (; type = scanner.tokenType; scanner.next()) {
        if (type !== SOLIDUS &&
            type !== ASTERISK &&
            type !== DOLLARSIGN) {
            break;
        }
    }

    scanIdent(true);

    return scanner.substrToCursor(start);
}

function getValue(nested, property) {
    // special parser for filter property since it can contains non-standart syntax for old IE
    if (property !== null && endsWith(property, 'filter') && checkProgid()) {
        return getFilterValue();
    }

    var start = scanner.tokenStart;
    var sequence = new List();
    var wasSpace = false;
    var child;

    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTCURLYBRACKET:
            case SEMICOLON:
            case EXCLAMATIONMARK:
                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    scanner.error();
                }

                break scan;

            case WHITESPACE:
                wasSpace = true;
                scanner.next();
                continue;

            case COMMENT: // ignore comments
                scanner.next();
                continue;

            case NUMBERSIGN:
                child = getHash();
                break;

            case SOLIDUS:
            case COMMA:
                child = getOperator();
                break;

            case LEFTPARENTHESIS:
                child = getParentheses(SCOPE_VALUE);
                break;

            case STRING:
                child = getString();
                break;

            default:
                // check for unicode range: U+0F00, U+0F00-0FFF, u+0F00??
                if (scanner.tokenType === IDENTIFIER &&
                    scanner.lookupValue(0, 'u')) {
                    if (
                        scanner.lookupType(1) === PLUSSIGN || (
                            scanner.lookupType(1) === NUMBER &&
                            cmpChar(scanner.source, scanner.tokenEnd, PLUSSIGN)
                       )) {
                        child = getUnicodeRange();
                        break;
                    }
                }

                child = getAny(SCOPE_VALUE);
        }

        if (wasSpace) {
            wasSpace = false;
            sequence.appendData(SPACE_NODE);
        }

        sequence.appendData(child);
    }

    return {
        type: 'Value',
        info: getInfo(start),
        sequence: sequence
    };
}

function getFilterValue() {
    var start = scanner.tokenStart;
    var sequence = new List();
    var progid;

    while (progid = checkProgid()) {
        readSC();
        sequence.appendData(getProgid(progid));
    }

    readSC();

    return {
        type: 'Value',
        info: getInfo(start),
        sequence: sequence
    };
}

// any = percentage | dimension | number | operator | ident | function
function getAny(scope) {
    switch (scanner.tokenType) {
        case IDENTIFIER:
            break;

        case HYPHENMINUS:
            var nextType = scanner.lookupType(1);
            if (nextType === IDENTIFIER || nextType === HYPHENMINUS) {
                break;
            }
            return getOperator();

        case PLUSSIGN:
            return getOperator();

        case NUMBER:
            switch (scanner.lookupType(1)) {
                case PERCENTSIGN:
                    return getPercentage();

                case IDENTIFIER:
                    return getDimension();

                default:
                    return {
                        type: 'Number',
                        info: getInfo(),
                        value: readNumber()
                    };
            }

        default:
            scanner.error();
    }

    var start = scanner.tokenStart;

    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(scope, getInfo(start), scanner.substrToCursor(start));
    }

    return {
        type: 'Identifier',
        info: getInfo(start),
        name: scanner.substrToCursor(start)
    };
}

function readAttrselector() {
    var start = scanner.tokenStart;
    var tokenType = scanner.tokenType;

    if (tokenType !== EQUALSSIGN &&        // =
        tokenType !== TILDE &&             // ~=
        tokenType !== CIRCUMFLEXACCENT &&  // ^=
        tokenType !== DOLLARSIGN &&        // $=
        tokenType !== ASTERISK &&          // *=
        tokenType !== VERTICALLINE         // |=
    ) {
        scanner.error('Attribute selector (=, ~=, ^=, $=, *=, |=) is expected');
    }

    if (tokenType === EQUALSSIGN) {
        scanner.next();
    } else {
        scanner.next();
        scanner.eat(EQUALSSIGN);
    }

    return scanner.substrToCursor(start);
}

// '[' S* attrib_name ']'
// '[' S* attrib_name S* attrib_match S* [ IDENT | STRING ] S* attrib_flags? S* ']'
function getAttribute() {
    var node = {
        type: 'Attribute',
        info: getInfo(),
        name: null,
        operator: null,
        value: null,
        flags: null
    };

    scanner.eat(LEFTSQUAREBRACKET);
    readSC();

    node.name = getAttributeName();
    readSC();

    if (scanner.tokenType !== RIGHTSQUAREBRACKET) {
        // avoid case `[name i]`
        if (scanner.tokenType !== IDENTIFIER) {
            node.operator = readAttrselector();

            readSC();

            node.value = scanner.tokenType === STRING
                ? getString()
                : getIdentifier(false);

            readSC();
        }

        // attribute flags
        if (scanner.tokenType === IDENTIFIER) {
            node.flags = scanner.getTokenValue();
            scanner.next();

            readSC();
        }
    }

    scanner.eat(RIGHTSQUAREBRACKET);

    return node;
}

function getParentheses(scope) {
    var start = scanner.tokenStart;
    var sequence = new List();
    var wasSpace = false;
    var child;

    // left brace
    scanner.eat(LEFTPARENTHESIS);
    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTPARENTHESIS:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                scanner.next();
                continue;

            case COMMENT: // ignore comments
                scanner.next();
                continue;

            case LEFTPARENTHESIS:
                child = getParentheses(scope);
                break;

            case SOLIDUS:
            case ASTERISK:
            case COMMA:
            case COLON:
                child = getOperator();
                break;

            case NUMBERSIGN:
                child = getHash();
                break;

            case STRING:
                child = getString();
                break;

            default:
                child = getAny(scope);
        }

        if (wasSpace) {
            wasSpace = false;
            sequence.appendData(SPACE_NODE);
        }

        sequence.appendData(child);
    }

    // right brace
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Parentheses',
        info: getInfo(start),
        sequence: sequence
    };
}

// '.' ident
function getClass() {
    var start = scanner.tokenStart;

    scanner.eat(FULLSTOP);

    return {
        type: 'Class',
        info: getInfo(start),
        name: readIdent(false)
    };
}

// '#' ident
function getId() {
    var start = scanner.tokenStart;

    scanner.eat(NUMBERSIGN);

    return {
        type: 'Id',
        info: getInfo(start),
        name: readIdent(false)
    };
}

// + | > | ~ | /deep/ | >>
function getCombinator() {
    var start = scanner.tokenStart;
    var combinator;

    switch (scanner.tokenType) {
        case GREATERTHANSIGN:
            scanner.next();

            if (scanner.tokenType === GREATERTHANSIGN) {
                combinator = '>>';
                scanner.next();
            } else {
                combinator = '>';
            }
            break;

        case PLUSSIGN:
        case TILDE:
            combinator = scanner.getTokenValue();
            scanner.next();
            break;

        case SOLIDUS:
            combinator = '/deep/';

            scanner.next();
            scanner.expectIdentifier('deep');
            scanner.eat(SOLIDUS);
            break;
    }

    return {
        type: 'Combinator',
        info: getInfo(start),
        name: combinator
    };
}

// '/*' .* '*/'
function getComment() {
    var start = scanner.tokenStart + 2;
    var end = scanner.tokenEnd;

    if ((end - start) >= 2 &&
        scanner.source.charCodeAt(end - 2) === ASTERISK &&
        scanner.source.charCodeAt(end - 1) === SOLIDUS) {
        end -= 2;
    }

    scanner.next();

    return {
        type: 'Comment',
        info: getInfo(start),
        value: scanner.source.substring(start, end)
    };
}

// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
function readUnit() {
    var unit = scanner.getTokenValue();
    var backSlashPos = unit.indexOf('\\');

    if (backSlashPos !== -1) {
        // patch token offset
        scanner.tokenStart += backSlashPos;
        // scanner.token.start = scanner.tokenStart;

        // return part before backslash
        return unit.substring(0, backSlashPos);
    }

    // no backslash in unit name
    scanner.next();

    return unit;
}

// number ident
function getDimension() {
    return {
        type: 'Dimension',
        info: getInfo(),
        value: readNumber(),
        unit: readUnit()
    };
}

function getPercentage() {
    var start = scanner.tokenStart;
    var number = readNumber();

    scanner.eat(PERCENTSIGN);

    return {
        type: 'Percentage',
        info: getInfo(start),
        value: number
    };
}

// ident '(' functionBody ')' |
// not '(' <simpleSelector>* ')'
function getFunction(scope, info, name) {
    // parse special functions
    var nameLowerCase = name.toLowerCase();

    switch (scope) {
        case SCOPE_SELECTOR:
            if (SCOPE_SELECTOR.hasOwnProperty(nameLowerCase)) {
                return SCOPE_SELECTOR[nameLowerCase](scope, info, name);
            }
            break;
        case SCOPE_VALUE:
            if (SCOPE_VALUE.hasOwnProperty(nameLowerCase)) {
                return SCOPE_VALUE[nameLowerCase](scope, info, name);
            }
            break;
        case SCOPE_ATRULE_EXPRESSION:
            if (SCOPE_ATRULE_EXPRESSION.hasOwnProperty(nameLowerCase)) {
                return SCOPE_ATRULE_EXPRESSION[nameLowerCase](scope, info, name);
            }
            break;
    }

    return getFunctionInternal(getFunctionArguments, scope, info, name);
}

function getFunctionInternal(readSequence, scope, info, name) {
    var sequence;

    scanner.eat(LEFTPARENTHESIS);
    sequence = readSequence(scope);
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: scope === SCOPE_SELECTOR ? 'PseudoClass' : 'Function',
        info: info,
        name: name,
        sequence: sequence
    };
}

function getFunctionArguments(scope) {
    var sequence = new List();
    var wasSpace = false;
    var prevNonSpaceOperator = false;
    var nonSpaceOperator = false;
    var child;

    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTPARENTHESIS:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                scanner.next();
                continue;

            case COMMENT: // ignore comments
                scanner.next();
                continue;

            case NUMBERSIGN: // TODO: not sure it should be here
                child = getHash();
                break;

            case LEFTPARENTHESIS:
                child = getParentheses(scope);
                break;

            case COMMA:
            case SOLIDUS:
            case ASTERISK:
                wasSpace = false;
                nonSpaceOperator = true;
                child = getOperator();
                break;

            case STRING:
                child = getString();
                break;

            default:
                child = getAny(scope);
        }

        if (wasSpace) {
            wasSpace = false;

            // ignore spaces around operator
            if (!nonSpaceOperator && !prevNonSpaceOperator) {
                sequence.appendData(SPACE_NODE);
            }
        }

        sequence.appendData(child);
        prevNonSpaceOperator = nonSpaceOperator;
        nonSpaceOperator = false;
    }

    return sequence;
}

function getVarFunction(scope, info, name) {
    return getFunctionInternal(getVarFunctionArguments, scope, info, name);
}

// TODO: -> getSimpleSelectorList
function getNotFunctionArguments() {
    var args = new List();
    var wasSelector = false;

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTPARENTHESIS:
                if (!wasSelector) {
                    scanner.error('Simple selector is expected');
                }

                break scan;

            case COMMA:
                if (!wasSelector) {
                    scanner.error('Simple selector is expected');
                }

                wasSelector = false;
                scanner.next();
                break;

            default:
                wasSelector = true;
                args.appendData(getSimpleSelector(true));
        }
    }

    return args;
}

function getNotFunction(scope, info) {
    var selectors;

    scanner.eat(LEFTPARENTHESIS);
    selectors = getNotFunctionArguments(scope);
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Negation',
        info: info,
        // name: name,    // TODO: add name?
        sequence: selectors  // TODO: sequence -> selectors
    };
}

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionArguments() { // TODO: special type Variable?
    var sequence = new List();

    readSC();
    sequence.appendData(getIdentifier(true));
    readSC();

    if (scanner.tokenType === COMMA) {
        sequence.appendData(getOperator());

        readSC();
        sequence.appendData(getValue(true, null));
        readSC();
    }

    return sequence;
}

// url '(' ws* (string | raw) ws* ')'
function getUri(scope, info) {
    var value;

    scanner.eat(LEFTPARENTHESIS); // (
    readSC();

    if (scanner.tokenType === STRING) {
        value = getString();
    } else {
        var start = scanner.tokenStart;

        // TODO: fix me, looks like incorrect raw scan
        for (; !scanner.eof; scanner.next()) {
            var type = scanner.tokenType;

            if (type === WHITESPACE ||
                type === LEFTPARENTHESIS ||
                type === RIGHTPARENTHESIS) {
                break;
            }
        }

        value = {
            type: 'Raw',
            info: getInfo(start),
            value: scanner.substrToCursor(start)
        };
    }

    readSC();
    scanner.eat(RIGHTPARENTHESIS); // )

    return {
        type: 'Url',
        info: info,
        value: value
    };
}

// expression '(' raw ')'
function getOldIEExpression(scope, info, name) {
    var start = scanner.tokenStart + 1; // skip open parenthesis
    var raw;

    scanner.eat(LEFTPARENTHESIS);

    for (var balance = 0; !scanner.eof; scanner.next()) {
        if (scanner.tokenType === RIGHTPARENTHESIS) {
            if (balance === 0) {
                break;
            }

            balance--;
        } else if (scanner.tokenType === LEFTPARENTHESIS) {
            balance++;
        }

    }

    raw = scanner.substrToCursor(start);

    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Function',
        info: info,
        name: name,
        sequence: new List().appendData({
            type: 'Raw',
            value: raw
        })
    };
}

// https://drafts.csswg.org/css-syntax-3/#urange
function scanUnicodeRange() {
    var hexStart = scanner.tokenStart + 1; // skip +
    var hexLength = 0;

    scanner.next(); // always PLUSSIGN or NUMBER

    if (scanner.tokenType === HYPHENMINUS) {
        scanner.next();
    }

    if (scanner.tokenType === NUMBER) {
        scanner.next();
    }

    if (scanner.tokenType === IDENTIFIER) {
        scanner.next();
    }

    if (scanner.tokenStart === hexStart) {
        scanner.error('Unexpected input', hexStart);
    }

    // validate hex for U+xxxxxx or U+xxxxxx-xxxxxx
    // TODO: check hex sequence length
    for (var i = hexStart, wasHyphenMinus = false; i < scanner.tokenStart; i++) {
        var code = scanner.source.charCodeAt(i);

        if (isHex(code) === false && (code !== HYPHENMINUS || wasHyphenMinus)) {
            scanner.error('Unexpected input', i);
        }

        if (code === HYPHENMINUS) {
            // hex sequence shouldn't be an empty
            if (hexLength === 0) {
                scanner.error('Unexpected input', i);
            }

            wasHyphenMinus = true;
            hexLength = 0;
        } else {
            hexLength++;

            // to long hex sequence
            if (hexLength > 6) {
                scanner.error('Unexpected input', i);
            }
        }

    }

    // U+abc???
    if (!wasHyphenMinus) {
        // consume as many U+003F QUESTION MARK (?) code points as possible
        for (; hexLength < 6 && !scanner.eof; scanner.next()) {
            if (scanner.tokenType !== QUESTIONMARK) {
                break;
            }

            hexLength++;
        }
    }
}

function getUnicodeRange() {
    var start = scanner.tokenStart;

    scanner.next(); // U or u
    scanUnicodeRange();

    return {
        type: 'UnicodeRange',
        info: getInfo(start),
        name: scanner.substrToCursor(start)
    };
}

function scanIdent(varAllowed) {
    // optional first -
    if (scanner.tokenType === HYPHENMINUS) {
        scanner.next();

        // variable --
        if (varAllowed && scanner.tokenType === HYPHENMINUS) {
            scanner.next();
        }
    }

    scanner.eat(IDENTIFIER);
}

function readIdent(varAllowed) {
    var start = scanner.tokenStart;

    scanIdent(varAllowed);

    return scanner.substrToCursor(start);
}

function getAttributeName() {
    if (scanner.eof) {
        scanner.error('Unexpected end of input');
    }

    var start = scanner.tokenStart;
    var expectIdentifier = false;
    var checkColon = true;

    if (scanner.tokenType === ASTERISK) {
        expectIdentifier = true;
        checkColon = false;
        scanner.next();
    } else if (scanner.tokenType !== VERTICALLINE) {
        scanIdent(false);
    }

    if (scanner.tokenType === VERTICALLINE) {
        if (scanner.lookupType(1) !== EQUALSSIGN) {
            scanner.next();

            if (scanner.tokenType === HYPHENMINUS || scanner.tokenType === IDENTIFIER) {
                scanIdent(false);
            } else {
                scanner.error('Identifier is expected');
            }
        } else if (expectIdentifier) {
            scanner.error('Identifier is expected', scanner.tokenEnd);
        }
    } else if (expectIdentifier) {
        scanner.error('Vertical line is expected');
    }

    if (checkColon && scanner.tokenType === COLON) {
        scanner.next();
        scanIdent(false);
    }

    return {
        type: 'Identifier',
        info: getInfo(start),
        name: scanner.substrToCursor(start)
    };
}

function getTypeOrUniversal() {
    var start = scanner.tokenStart;
    var universal = false;

    if (scanner.tokenType === ASTERISK) {
        universal = true;
        scanner.next();
    } else if (scanner.tokenType !== VERTICALLINE) {
        scanIdent(false);
    }

    if (scanner.tokenType === VERTICALLINE) {
        universal = false;
        scanner.next();

        if (scanner.tokenType === HYPHENMINUS || scanner.tokenType === IDENTIFIER) {
            scanIdent(false);
        } else if (scanner.tokenType === ASTERISK) {
            universal = true;
            scanner.next();
        } else {
            scanner.error('Identifier or asterisk is expected');
        }
    }

    return {
        type: universal ? 'Universal' : 'Type',
        info: getInfo(start),
        name: scanner.substrToCursor(start)
    };
}

function getIdentifier(varAllowed) {
    return {
        type: 'Identifier',
        info: getInfo(),
        name: readIdent(varAllowed)
    };
}

// ! ws* important
function getImportant() {
    scanner.eat(EXCLAMATIONMARK);
    readSC();

    scanner.expectIdentifier('important');

    // should return identifier in future for original source restoring as is
    // returns true for now since it's fit to optimizer purposes
    return true;
}

// https://drafts.csswg.org/css-syntax-3/#the-anb-type
function getNthSelector() {
    var start = scanner.tokenStart;
    var sequence = new List();
    var name;

    scanner.eat(COLON);
    name = readIdent(false);
    scanner.eat(LEFTPARENTHESIS);
    readSC();

    if (scanner.lookupValue(0, 'odd') || scanner.lookupValue(0, 'even')) {
        var start = scanner.tokenStart;
        var info = getInfo();

        scanner.next();
        sequence.appendData({
            type: 'Nth',
            info: info,
            value: scanner.substrToCursor(start)
        });
    } else {
        var prefix = '';
        var start = scanner.tokenStart;
        var info = getInfo();

        if (scanner.tokenType === HYPHENMINUS ||
            scanner.tokenType === PLUSSIGN ||
            scanner.tokenType === NUMBER) {
            prefix = scanner.getTokenValue();
            scanner.next();
        }

        if (scanner.tokenType === IDENTIFIER) {
            if (!cmpChar(scanner.source, scanner.tokenStart, N)) {
                scanner.error();
            }

            sequence.appendData({
                type: 'Nth',
                info: info,
                value: prefix + scanner.source.charAt(scanner.tokenStart)
            });

            var len = scanner.tokenEnd - scanner.tokenStart;
            if (len > 1) {
                var start = scanner.tokenStart;
                // ..n-..
                if (scanner.source.charCodeAt(start + 1) !== HYPHENMINUS) {
                    scanner.error('Unexpected input', start + 1);
                }

                scanner.tokenStart = start + 1;
                sequence.appendData({
                    type: 'Operator',
                    info: getInfo(),
                    value: scanner.source.charAt(start + 1)
                });

                // ..n-{number}..
                if (len > 2) {
                    for (var i = start + 2; i < scanner.tokenEnd; i++) {
                        if (!isNumber(scanner.source.charCodeAt(i))) {
                            scanner.error('Unexpected input', i);
                        }
                    }

                    scanner.tokenStart = start + 2;
                    var info = getInfo();
                    scanner.next();

                    sequence.appendData({
                        type: 'Nth',
                        info: info,
                        value: scanner.substrToCursor(start + 2)
                    });

                } else {
                    scanner.next();
                    readSC();

                    if (scanner.tokenType !== NUMBER ||
                        cmpChar(scanner.source, scanner.tokenStart, PLUSSIGN) ||
                        cmpChar(scanner.source, scanner.tokenStart, HYPHENMINUS)) {
                        scanner.error();
                    }

                    sequence.appendData({
                        type: 'Nth',
                        info: getInfo(),
                        value: scanner.getTokenValue()
                    });

                    scanner.next();
                }
            } else {
                prefix = '';
                scanner.next();
                readSC();

                if (scanner.tokenType === HYPHENMINUS ||
                    scanner.tokenType === PLUSSIGN) {
                    info = getInfo();
                    prefix = scanner.getTokenValue();
                    scanner.next();
                    readSC();
                }

                if (scanner.tokenType === NUMBER) {
                    var sign = '';

                    if (cmpChar(scanner.source, scanner.tokenStart, PLUSSIGN) ||
                        cmpChar(scanner.source, scanner.tokenStart, HYPHENMINUS)) {
                        info = getInfo();
                        sign = scanner.source.charAt(scanner.tokenStart);
                    }

                    // prefix or sign should be specified but not both
                    if (!(prefix === '' ^ sign === '')) {
                        scanner.error();
                    }

                    if (sign) {
                        scanner.tokenStart++;
                    }

                    sequence.appendData({
                        type: 'Operator',
                        info: info,
                        value: prefix || sign
                    });

                    sequence.appendData({
                        type: 'Nth',
                        info: getInfo(),
                        value: scanner.getTokenValue()
                    });

                    scanner.next();
                }
            }
        } else {
            if (prefix === '' || prefix === '-' || prefix === '+') { // no number
                scanner.error('Number or identifier is expected');
            }

            sequence.appendData({
                type: 'Nth',
                info: info,
                value: prefix
            });
        }
    }

    readSC();
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'PseudoClass',
        info: getInfo(start),
        name: name,
        sequence: sequence
    };
}

function readNumber() {
    var number = scanner.getTokenValue();

    scanner.eat(NUMBER);

    return number;
}

// '/' | '*' | ',' | ':' | '+' | '-'
function getOperator() {
    var start = scanner.tokenStart;

    scanner.next();

    return {
        type: 'Operator',
        info: getInfo(start),
        value: scanner.substrToCursor(start)
    };
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid() {
    var startOffset = findNonSCOffset(0);
    var offset = startOffset;

    if (scanner.lookupValue(offset, 'alpha') ||
        scanner.lookupValue(offset, 'dropshadow')) {
        offset++;
    } else {
        if (scanner.lookupValue(offset, 'progid') === false ||
            scanner.lookupType(offset + 1) !== COLON) {
            return false; // fail
        }

        offset += 2;
        offset = findNonSCOffset(offset);

        if (scanner.lookupValue(offset + 0, 'dximagetransform') === false ||
            scanner.lookupType(offset + 1) !== FULLSTOP ||
            scanner.lookupValue(offset + 2, 'microsoft') === false ||
            scanner.lookupType(offset + 3) !== FULLSTOP ||
            scanner.lookupType(offset + 4) !== IDENTIFIER) {
            return false; // fail
        }

        offset += 5;
        offset = findNonSCOffset(offset);
    }

    if (scanner.lookupType(offset) !== LEFTPARENTHESIS) {
        return false; // fail
    }

    for (var type; type = scanner.lookupType(offset); offset++) {
        if (type === RIGHTPARENTHESIS) {
            return offset - startOffset + 1;
        }
    }

    return false;
}

function getProgid(progidEnd) {
    var start = scanner.tokenStart;

    scanner.skip(progidEnd);

    return {
        type: 'Progid',
        info: getInfo(start),
        value: scanner.substrToCursor(start)
    };
}

// <pseudo-element> | <nth-selector> | <pseudo-class>
function getPseudo() {
    var nextType = scanner.lookupType(1);

    if (nextType === COLON) {
        return getPseudoElement();
    }

    if (nextType === IDENTIFIER) {
        // '::' starts a pseudo-element, ':' a pseudo-class
        // Exceptions: :first-line, :first-letter, :before and :after
        if (scanner.lookupValue(1, 'before') ||
            scanner.lookupValue(1, 'after') ||
            scanner.lookupValue(1, 'first-letter') ||
            scanner.lookupValue(1, 'first-line')) {
            return getLegacyPseudoElement();
        }

        if (cmpStr(scanner.source, scanner.tokenEnd, scanner.tokenEnd + 4, 'nth-')) {
            return getNthSelector();
        }
    }

    return getPseudoClass();
}

// :: ident
function getPseudoElement() {
    var start = scanner.tokenStart;

    scanner.eat(COLON);
    scanner.eat(COLON);

    return {
        type: 'PseudoElement',
        info: getInfo(start),
        name: readIdent(false),
        legacy: false
    };
}

// : ident
// https://drafts.csswg.org/selectors-4/#grammar
// Some older pseudo-elements (::before, ::after, ::first-line, and ::first-letter)
// can, for legacy reasons, be written using the <pseudo-class-selector> grammar,
// with only a single ":" character at their start.
function getLegacyPseudoElement() {
    var start = scanner.tokenStart;

    scanner.eat(COLON);

    return {
        type: 'PseudoElement',
        info: getInfo(start),
        name: readIdent(false),
        legacy: true
    };
}

// : ( ident | function )
function getPseudoClass() {
    var start = scanner.tokenStart;

    scanner.eat(COLON);
    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(SCOPE_SELECTOR, getInfo(start), scanner.substrToCursor(start + 1));
    }

    return {
        type: 'PseudoClass',
        info: getInfo(start),
        name: scanner.substrToCursor(start + 1),
        sequence: null
    };
}

function findNonSCOffset(offset) {
    for (var type; type = scanner.lookupType(offset); offset++) {
        if (type !== WHITESPACE && type !== COMMENT) {
            break;
        }
    }

    return offset;
}

function readSC() {
    while (scanner.tokenType === WHITESPACE || scanner.tokenType === COMMENT) {
        scanner.next();
    }
}

// node: String
function getString() {
    var start = scanner.tokenStart;

    scanner.next();

    return {
        type: 'String',
        info: getInfo(start),
        value: scanner.substrToCursor(start)
    };
}

// # ident
function getHash() {
    var start = scanner.tokenStart;

    scanner.eat(NUMBERSIGN);

    if (scanner.tokenType !== NUMBER &&
        scanner.tokenType !== IDENTIFIER) {
        scanner.error('Number or identifier is expected');
    }

    scanner.next(); // number or identifier

    // there was a number before identifier
    if (scanner.tokenType === IDENTIFIER) {
        scanner.next();
    }

    return {
        type: 'Hash',
        info: getInfo(start),
        value: scanner.substrToCursor(start + 1) // skip #
    };
}

function parse(source, options) {
    var ast;

    if (!options || typeof options !== 'object') {
        options = {};
    }

    var context = options.context || 'stylesheet';
    needPositions = Boolean(options.positions);
    filename = options.filename || '<unknown>';

    if (!initialContext.hasOwnProperty(context)) {
        throw new Error('Unknown context `' + context + '`');
    }

    scanner = new Scanner(source, options.line, options.column);

    if (context === 'value') {
        ast = getValue(false, options.property ? String(options.property) : null);
    } else {
        ast = initialContext[context]();
    }

    scanner = null;

    // console.log(JSON.stringify(ast, null, 4));
    return ast;
};

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parse('a.b#c:e:NOT(a)::g,* b >c+d~e/deep/f,100%{v:1 2em t a(2%, var(--a)) url(..) -foo-bar !important}');

module.exports = parse;
