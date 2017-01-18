'use strict';

var List = require('../utils/list');
var Scanner = require('../scanner');

var scanner = new Scanner();
var cmpChar = Scanner.cmpChar;
var endsWith = Scanner.endsWith;
var isNumber = Scanner.isNumber;
var isHex = Scanner.isHex;
var needPositions;
var filename;

var DESCENDANT_COMBINATOR = {};
var SPACE_NODE = { type: 'Space' };
var NESTED = true;
var ABSOLUTE = false;
var RELATIVE = true;

var WHITESPACE = Scanner.TYPE.Whitespace;
var IDENTIFIER = Scanner.TYPE.Identifier;
var NUMBER = Scanner.TYPE.Number;
var STRING = Scanner.TYPE.String;
var COMMENT = Scanner.TYPE.Comment;
var EXCLAMATIONMARK = Scanner.TYPE.ExclamationMark;
var NUMBERSIGN = Scanner.TYPE.NumberSign;
var DOLLARSIGN = Scanner.TYPE.DollarSign;
var PERCENTSIGN = Scanner.TYPE.PercentSign;
var LEFTPARENTHESIS = Scanner.TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = Scanner.TYPE.RightParenthesis;
var ASTERISK = Scanner.TYPE.Asterisk;
var PLUSSIGN = Scanner.TYPE.PlusSign;
var COMMA = Scanner.TYPE.Comma;
var HYPHENMINUS = Scanner.TYPE.HyphenMinus;
var FULLSTOP = Scanner.TYPE.FullStop;
var SOLIDUS = Scanner.TYPE.Solidus;
var COLON = Scanner.TYPE.Colon;
var SEMICOLON = Scanner.TYPE.Semicolon;
var EQUALSSIGN = Scanner.TYPE.EqualsSign;
var GREATERTHANSIGN = Scanner.TYPE.GreaterThanSign;
var QUESTIONMARK = Scanner.TYPE.QuestionMark;
var COMMERCIALAT = Scanner.TYPE.CommercialAt;
var LEFTSQUAREBRACKET = Scanner.TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = Scanner.TYPE.RightSquareBracket;
var CIRCUMFLEXACCENT = Scanner.TYPE.CircumflexAccent;
var LEFTCURLYBRACKET = Scanner.TYPE.LeftCurlyBracket;
var VERTICALLINE = Scanner.TYPE.VerticalLine;
var RIGHTCURLYBRACKET = Scanner.TYPE.RightCurlyBracket;
var TILDE = Scanner.TYPE.Tilde;
var N = 110; // 'n'.charCodeAt(0)

var SCOPE_ATRULE_EXPRESSION = {
    url: getUri
};
var SCOPE_SELECTOR = {
    url: getUri,
    not: getSelectorListFunction,
    matches: getSelectorListFunction,
    has: getRelativeSelectorListFunction
};
var SCOPE_VALUE = {
    url: getUri,
    expression: getOldIEExpression,
    var: getVarFunction
};

var CONTEXT = {
    stylesheet: getStylesheet,
    atrule: getAtrule,
    atruleExpression: getAtruleExpression,
    rule: getRule,
    selectorList: getSelectorList,
    selector: getSelector,
    block: getBlock,
    declaration: getDeclaration,
    value: getValue
};

function getLocation(start, end) {
    if (needPositions) {
        return scanner.getLocationRange(
            start,
            end,
            filename
        );
    }

    return null;
}

function getStylesheet(nested) {
    var start = scanner.tokenStart;
    var children = new List();
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

        children.appendData(child);
    }

    return {
        type: 'StyleSheet',
        loc: getLocation(start, scanner.tokenStart),
        children: children
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
    var start;
    var children = new List();
    var wasSpace = false;
    var lastNonSpace = null;
    var child;

    readSC();
    start = scanner.tokenStart;

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
            children.appendData(SPACE_NODE);
        }

        lastNonSpace = scanner.tokenStart;
        children.appendData(child);
    }

    return {
        type: 'AtruleExpression',
        loc: getLocation(start, lastNonSpace !== null ? lastNonSpace : scanner.tokenStart),
        children: children
    };
}

function getAtrule() {
    var start = scanner.tokenStart;
    var name;
    var expression;
    var block = null;

    scanner.eat(COMMERCIALAT);

    name = readIdent(false);
    expression = getAtruleExpression();

    switch (scanner.tokenType) {
        case SEMICOLON:
            scanner.next();  // ;
            break;

        case LEFTCURLYBRACKET:
            scanner.next();  // {

            block = isBlockAtrule()
                ? getBlock()
                : getStylesheet(NESTED);

            scanner.eat(RIGHTCURLYBRACKET);
            break;

        // at-rule expression can ends with semicolon, left curly bracket or eof - no other options
    }

    return {
        type: 'Atrule',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        expression: expression,
        block: block
    };
}

function getRule() {
    var start = scanner.tokenStart;
    var selector = getSelectorList();
    var block;

    scanner.eat(LEFTCURLYBRACKET);
    block = getBlock();
    scanner.eat(RIGHTCURLYBRACKET);

    return {
        type: 'Rule',
        loc: getLocation(start, scanner.tokenStart),
        selector: selector,
        block: block
    };
}

function getSelectorList(nested, relative) {
    var start = scanner.tokenStart;
    var children = new List();
    var selector;
    var lastComma = -2;

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
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

            case COMMA:
                if (lastComma !== -1) {
                    scanner.error('Unexpected comma');
                }

                lastComma = scanner.tokenStart;
                scanner.next();
                break;

            default:
                lastComma = -1;
                selector = getSelector(nested, relative);
                children.appendData(selector);

                if (selector.children.isEmpty()) {
                    scanner.error('Simple selector expected');
                }
        }
    }

    if (lastComma !== -1 && lastComma !== -2) { // TODO: fail on empty selector rules?
        scanner.error('Unexpected trailing comma', lastComma);
    }

    return {
        type: 'SelectorList',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

function getSelector(nested, relative) {
    var start = scanner.tokenStart;
    var children = new List();
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
                if (combinator === null && children.head !== null) {
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
                if ((children.head === null && !relative) || // combinator in the beginning
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
                    loc: getLocation(combinatorOffset, combinatorOffset + 1),
                    name: ' '
                };
            }

            children.appendData(combinator);
            combinator = null;
        }

        children.appendData(child);
    }

    if (combinator !== null && combinator !== DESCENDANT_COMBINATOR) {
        scanner.error('Unexpected combinator', combinatorOffset);
    }

    return {
        type: 'Selector',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

function getCompoundSelector(nested) {
    var start = scanner.tokenStart;
    var children = new List();
    var child;

    readSC();

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
                readSC();
                break scan;

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

            default:
                scanner.error();
        }

        children.appendData(child);
    }

    if (children.isEmpty()) {
        scanner.error('Simple selector expected');
    }

    return {
        type: 'Selector',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

function getBlock() {
    var start = scanner.tokenStart;
    var children = new List();

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

            case COMMERCIALAT:
                children.appendData(getAtrule());
                break;

            default:
                children.appendData(getDeclaration());
        }
    }

    return {
        type: 'Block',
        loc: getLocation(start, scanner.tokenStart),
        children: children
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

    // TODO: include or not to include semicolon to range?
    // if (scanner.tokenType === SEMICOLON) {
    //     scanner.next();
    // }

    return {
        type: 'Declaration',
        loc: getLocation(start, scanner.tokenStart),
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
    var children = new List();
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

            case LEFTSQUAREBRACKET:
                child = getBrackets();
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
            children.appendData(SPACE_NODE);
        }

        children.appendData(child);
    }

    return {
        type: 'Value',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

function getFilterValue() {
    var start = scanner.tokenStart;
    var children = new List();
    var progid;

    while (progid = checkProgid()) {
        readSC();
        children.appendData(getProgid(progid));
    }

    readSC();

    return {
        type: 'Value',
        loc: getLocation(start, scanner.tokenStart),
        children: children
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
                        loc: getLocation(scanner.tokenStart, scanner.tokenEnd),
                        value: readNumber()
                    };
            }

        default:
            scanner.error();
    }

    var start = scanner.tokenStart;

    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(scope, start, scanner.substrToCursor(start));
    }

    return {
        type: 'Identifier',
        loc: getLocation(start, scanner.tokenStart),
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
    var start = scanner.tokenStart;
    var name;
    var operator = null;
    var value = null;
    var flags = null;

    scanner.eat(LEFTSQUAREBRACKET);
    readSC();

    name = getAttributeName();
    readSC();

    if (scanner.tokenType !== RIGHTSQUAREBRACKET) {
        // avoid case `[name i]`
        if (scanner.tokenType !== IDENTIFIER) {
            operator = readAttrselector();

            readSC();

            value = scanner.tokenType === STRING
                ? getString()
                : getIdentifier(false);

            readSC();
        }

        // attribute flags
        if (scanner.tokenType === IDENTIFIER) {
            flags = scanner.getTokenValue();
            scanner.next();

            readSC();
        }
    }

    scanner.eat(RIGHTSQUAREBRACKET);

    return {
        type: 'Attribute',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        operator: operator,
        value: value,
        flags: flags
    };
}

function getParentheses(scope) {
    var start = scanner.tokenStart;
    var children = new List();
    var wasSpace = false;
    var child;

    // left parenthesis
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
            children.appendData(SPACE_NODE);
        }

        children.appendData(child);
    }

    // right parenthesis
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Parentheses',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

// currently only Grid Layout uses square brackets
// https://drafts.csswg.org/css-grid/#track-sizing
// [ ident* ]
function getBrackets() {
    var start = scanner.tokenStart;
    var children = new List();
    var wasSpace = false;
    var child;

    // left bracket
    scanner.eat(LEFTSQUAREBRACKET);
    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTSQUAREBRACKET:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                scanner.next();
                continue;

            case COMMENT: // ignore comments
                scanner.next();
                continue;

            default:
                child = getIdentifier(false);
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(SPACE_NODE);
        }

        children.appendData(child);
    }

    // right bracket
    scanner.eat(RIGHTSQUAREBRACKET);

    return {
        type: 'Brackets',
        loc: getLocation(start, scanner.tokenStart),
        children: children
    };
}

// '.' ident
function getClass() {
    var start = scanner.tokenStart;
    var name;

    scanner.eat(FULLSTOP);
    name = readIdent(false);

    return {
        type: 'Class',
        loc: getLocation(start, scanner.tokenStart),
        name: name
    };
}

// '#' ident
function getId() {
    var start = scanner.tokenStart;
    var name;

    scanner.eat(NUMBERSIGN);
    name = readIdent(false);

    return {
        type: 'Id',
        loc: getLocation(start, scanner.tokenStart),
        name: name
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
        loc: getLocation(start, scanner.tokenStart),
        name: combinator
    };
}

// '/*' .* '*/'
function getComment() {
    var start = scanner.tokenStart;
    var end = scanner.tokenEnd;

    if ((end - start + 2) >= 2 &&
        scanner.source.charCodeAt(end - 2) === ASTERISK &&
        scanner.source.charCodeAt(end - 1) === SOLIDUS) {
        end -= 2;
    }

    scanner.next();

    return {
        type: 'Comment',
        loc: getLocation(start, scanner.tokenStart),
        value: scanner.source.substring(start + 2, end)
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
    var start = scanner.tokenStart;
    var value = readNumber();
    var unit = readUnit();

    return {
        type: 'Dimension',
        loc: getLocation(start, scanner.tokenStart),
        value: value,
        unit: unit
    };
}

function getPercentage() {
    var start = scanner.tokenStart;
    var number = readNumber();

    scanner.eat(PERCENTSIGN);

    return {
        type: 'Percentage',
        loc: getLocation(start, scanner.tokenStart),
        value: number
    };
}

// ident '(' functionBody ')'
function getFunction(scope, start, name) {
    // parse special functions
    var nameLowerCase = name.toLowerCase();

    switch (scope) {
        case SCOPE_SELECTOR:
            if (SCOPE_SELECTOR.hasOwnProperty(nameLowerCase)) {
                return SCOPE_SELECTOR[nameLowerCase](scope, start, name);
            }
            break;
        case SCOPE_VALUE:
            if (SCOPE_VALUE.hasOwnProperty(nameLowerCase)) {
                return SCOPE_VALUE[nameLowerCase](scope, start, name);
            }
            break;
        case SCOPE_ATRULE_EXPRESSION:
            if (SCOPE_ATRULE_EXPRESSION.hasOwnProperty(nameLowerCase)) {
                return SCOPE_ATRULE_EXPRESSION[nameLowerCase](scope, start, name);
            }
            break;
    }

    return getFunctionInternal(getFunctionArguments, scope, start, name);
}

function getFunctionInternal(readSequence, scope, start, name) {
    var children;

    scanner.eat(LEFTPARENTHESIS);
    children = readSequence(scope);
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: scope === SCOPE_SELECTOR ? 'PseudoClass' : 'Function',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        children: children
    };
}

function getFunctionArguments(scope) {
    var children = new List();
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
                children.appendData(SPACE_NODE);
            }
        }

        children.appendData(child);
        prevNonSpaceOperator = nonSpaceOperator;
        nonSpaceOperator = false;
    }

    return children;
}

function getSelectorListFunction(scope, start, name) {
    return getFunctionInternal(function() {
        return new List().appendData(getSelectorList(NESTED, ABSOLUTE));
    }, scope, start, name);
}

function getRelativeSelectorListFunction(scope, start, name) {
    return getFunctionInternal(function() {
        return new List().appendData(getSelectorList(NESTED, RELATIVE));
    }, scope, start, name);
}

function getVarFunction(scope, start, name) {
    return getFunctionInternal(getVarFunctionArguments, scope, start, name);
}

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionArguments() { // TODO: special type Variable?
    var children = new List();

    readSC();
    children.appendData(getIdentifier(true));
    readSC();

    if (scanner.tokenType === COMMA) {
        children.appendData(getOperator());

        readSC();
        children.appendData(getValue(true, null));
        readSC();
    }

    return children;
}

// url '(' ws* (string | raw) ws* ')'
function getUri(scope, start) {
    var value;

    scanner.eat(LEFTPARENTHESIS); // (
    readSC();

    if (scanner.tokenType === STRING) {
        value = getString();
    } else {
        var rawStart = scanner.tokenStart;

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
            loc: getLocation(rawStart, scanner.tokenStart),
            value: scanner.substrToCursor(rawStart)
        };
    }

    readSC();
    scanner.eat(RIGHTPARENTHESIS); // )

    return {
        type: 'Url',
        loc: getLocation(start, scanner.tokenStart),
        value: value
    };
}

// expression '(' raw ')'
function getOldIEExpression(scope, start, name) {
    var rawStart = scanner.tokenStart + 1; // skip open parenthesis
    var rawNode;

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

    rawNode = {
        type: 'Raw',
        loc: getLocation(rawStart, scanner.tokenStart),
        value: scanner.substrToCursor(rawStart)
    };

    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Function',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        children: new List().appendData(rawNode)
    };
}

function scanUnicodeNumber() {
    for (var pos = scanner.tokenStart + 1; pos < scanner.tokenEnd; pos++) {
        var code = scanner.source.charCodeAt(pos);

        // break on fullstop or hyperminus/plussign after exponent
        if (code === FULLSTOP || code === PLUSSIGN) {
            // break token, exclude symbol
            scanner.tokenStart = pos;
            return false;
        }
    }

    return true;
}

// https://drafts.csswg.org/css-syntax-3/#urange
function scanUnicodeRange() {
    var hexStart = scanner.tokenStart + 1; // skip +
    var hexLength = 0;

    scan: {
        if (scanner.tokenType === NUMBER) {
            if (scanner.source.charCodeAt(scanner.tokenStart) !== FULLSTOP && scanUnicodeNumber()) {
                scanner.next();
            } else if (scanner.source.charCodeAt(scanner.tokenStart) !== HYPHENMINUS) {
                break scan;
            }
        } else {
            scanner.next(); // PLUSSIGN
        }

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
    }

    // validate for U+x{1,6} or U+x{1,6}-x{1,6}
    // where x is [0-9a-fA-F]
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

    // check we have a non-zero sequence
    if (hexLength === 0) {
        scanner.error('Unexpected input', i - 1);
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
        loc: getLocation(start, scanner.tokenStart),
        value: scanner.substrToCursor(start)
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
        loc: getLocation(start, scanner.tokenStart),
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
        loc: getLocation(start, scanner.tokenStart),
        name: scanner.substrToCursor(start)
    };
}

function getIdentifier(varAllowed) {
    var start = scanner.tokenStart;
    var name = readIdent(varAllowed);

    return {
        type: 'Identifier',
        loc: getLocation(start, scanner.tokenStart),
        name: name
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

function checkTokenIsInteger() {
    var pos = scanner.tokenStart;

    if (scanner.source.charCodeAt(pos) === PLUSSIGN ||
        scanner.source.charCodeAt(pos) === HYPHENMINUS) {
        pos++;
    }

    for (; pos < scanner.tokenEnd; pos++) {
        if (!isNumber(scanner.source.charCodeAt(pos))) {
            scanner.error('Unexpected input', pos);
        }
    }
}

// https://drafts.csswg.org/css-syntax-3/#the-anb-type
function getNthSelector(allowOfClause) {
    var start = scanner.tokenStart;
    var selector = null;
    var query;
    var name;

    scanner.eat(COLON);
    name = readIdent(false);
    scanner.eat(LEFTPARENTHESIS);
    readSC();

    var nthStart = scanner.tokenStart;

    if (scanner.lookupValue(0, 'odd') || scanner.lookupValue(0, 'even')) {
        scanner.next();
        query = {
            type: 'Identifier',
            loc: getLocation(nthStart, scanner.tokenStart),
            name: scanner.substrToCursor(nthStart)
        };
    } else {
        // scan An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
        var prefix = '';
        var a = null;
        var b = null;

        if (scanner.tokenType === HYPHENMINUS ||
            scanner.tokenType === PLUSSIGN ||
            scanner.tokenType === NUMBER) {
            checkTokenIsInteger();
            prefix = scanner.getTokenValue();
            scanner.next();
        }

        if (scanner.tokenType === IDENTIFIER) {
            if (!cmpChar(scanner.source, scanner.tokenStart, N)) {
                scanner.error();
            }

            a = prefix === '' || prefix === '+' ? '1' :
                prefix === '-' ? '-1' :
                prefix;

            var len = scanner.tokenEnd - scanner.tokenStart;
            if (len > 1) {
                var bStart = scanner.tokenStart;
                // ..n-..
                if (scanner.source.charCodeAt(bStart + 1) !== HYPHENMINUS) {
                    scanner.error('Unexpected input', bStart + 1);
                }

                scanner.tokenStart = bStart + 1;

                // ..n-{number}..
                if (len > 2) {
                    for (var i = bStart + 2; i < scanner.tokenEnd; i++) {
                        if (!isNumber(scanner.source.charCodeAt(i))) {
                            scanner.error('Unexpected input', i);
                        }
                    }

                    scanner.next();
                    b = '-' + scanner.substrToCursor(bStart + 2);
                } else {
                    scanner.next();
                    readSC();

                    if (scanner.tokenType !== NUMBER ||
                        cmpChar(scanner.source, scanner.tokenStart, PLUSSIGN) ||
                        cmpChar(scanner.source, scanner.tokenStart, HYPHENMINUS)) {
                        scanner.error();
                    }

                    b = '-' + scanner.getTokenValue();
                    scanner.next();
                }
            } else {
                prefix = '';
                scanner.next();
                readSC();

                if (scanner.tokenType === HYPHENMINUS ||
                    scanner.tokenType === PLUSSIGN) {
                    prefix = scanner.getTokenValue();
                    scanner.next();
                    readSC();
                }

                if (scanner.tokenType === NUMBER) {
                    checkTokenIsInteger();

                    if (cmpChar(scanner.source, scanner.tokenStart, PLUSSIGN) ||
                        cmpChar(scanner.source, scanner.tokenStart, HYPHENMINUS)) {
                        // prefix or sign should be specified but not both
                        if (prefix !== '') {
                            scanner.error();
                        }

                        prefix = scanner.source.charAt(scanner.tokenStart);
                        scanner.tokenStart++;
                    }

                    if (prefix === '') {
                        // should be an operator before number
                        scanner.error();
                    } else if (prefix === '+') {
                        // plus is using by default
                        prefix = '';
                    }

                    b = prefix + scanner.getTokenValue();

                    scanner.next();
                }
            }
        } else {
            if (prefix === '' || prefix === '-' || prefix === '+') { // no number
                scanner.error('Number or identifier is expected');
            }

            b = prefix;
        }

        query = {
            type: 'An+B',
            loc: getLocation(nthStart, scanner.tokenStart),
            a: a,
            b: b
        };
    }

    readSC();

    if (allowOfClause && scanner.lookupValue(0, 'of')) {
        scanner.next();
        selector = getSelectorList(NESTED);
    }

    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'PseudoClass',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        children: new List().appendData({ // TODO: add loc
            type: 'Nth',
            nth: query,
            selector: selector
        })
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
        loc: getLocation(start, scanner.tokenStart),
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
        loc: getLocation(start, scanner.tokenStart),
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

        if (scanner.lookupValue(1, 'nth-child') ||
            scanner.lookupValue(1, 'nth-last-child')) {
            return getNthSelector(true);
        }

        if (scanner.lookupValue(1, 'nth-of-type') ||
            scanner.lookupValue(1, 'nth-last-of-type')) {
            return getNthSelector(false);
        }
    }

    return getPseudoClass();
}

// :: ident
function getPseudoElement() {
    var start = scanner.tokenStart;
    var name;
    var children = null;

    scanner.eat(COLON);
    scanner.eat(COLON);

    // https://drafts.csswg.org/css-scoping/#slotted-pseudo
    if (scanner.lookupValue(0, 'slotted')) {
        name = readIdent(false);
        scanner.eat(LEFTPARENTHESIS);
        children = new List().appendData(getCompoundSelector(true));
        scanner.eat(RIGHTPARENTHESIS);
    } else {
        name = readIdent(false);
    }

    return {
        type: 'PseudoElement',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        children: children,
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
    var name;

    scanner.eat(COLON);
    name = readIdent(false);

    return {
        type: 'PseudoElement',
        loc: getLocation(start, scanner.tokenStart),
        name: name,
        children: null,
        legacy: true
    };
}

// : ( ident | function )
function getPseudoClass() {
    var start = scanner.tokenStart;

    scanner.eat(COLON);
    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(SCOPE_SELECTOR, start, scanner.substrToCursor(start + 1));
    }

    return {
        type: 'PseudoClass',
        loc: getLocation(start, scanner.tokenStart),
        name: scanner.substrToCursor(start + 1),
        children: null
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
        loc: getLocation(start, scanner.tokenStart),
        value: scanner.substrToCursor(start)
    };
}

// # ident
function getHash() {
    var start = scanner.tokenStart;

    scanner.eat(NUMBERSIGN);

    scan:
    switch (scanner.tokenType) {
        case NUMBER:
            if (!isNumber(scanner.source.charCodeAt(scanner.tokenStart))) {
                scanner.error('Unexpected input', scanner.tokenStart);
            }

            for (var pos = scanner.tokenStart + 1; pos < scanner.tokenEnd; pos++) {
                var code = scanner.source.charCodeAt(pos);

                // break on fullstop or hyperminus/plussign after exponent
                if (code === FULLSTOP || code === HYPHENMINUS || code === PLUSSIGN) {
                    // break token, exclude symbol
                    scanner.tokenStart = pos;
                    break scan;
                }
            }

            // number contains digits only, go to next token
            scanner.next();

            // if next token is identifier add it to result
            if (scanner.tokenType === IDENTIFIER) {
                scanner.next();
            }

            break;

        case IDENTIFIER:
            scanner.next(); // add token to result
            break;

        default:
            scanner.error('Number or identifier is expected');
    }

    return {
        type: 'Hash',
        loc: getLocation(start, scanner.tokenStart),
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

    if (!CONTEXT.hasOwnProperty(context)) {
        throw new Error('Unknown context `' + context + '`');
    }

    scanner.setSource(source, options.line, options.column);

    if (context === 'value') {
        ast = getValue(false, options.property ? String(options.property) : null);
    } else {
        ast = CONTEXT[context]();
    }

    // console.log(JSON.stringify(ast, null, 4));
    return ast;
};

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parse('a.b#c:e:Not(a):Nth-child(2n+1)::g,* b >c+d~e/deep/f,100%{v:1 2em t a(2%, var(--a)) url(..) -foo-bar !important}');

module.exports = parse;
