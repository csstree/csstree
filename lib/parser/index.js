'use strict';

var TokenType = require('./const').TokenType;
var Scanner = require('./scanner');
var List = require('../utils/list');
var cmpStr = require('./utils').cmpStr;
var endsWith = require('./utils').endsWith;
var isHex = require('./utils').isHex;
var needPositions;
var filename;
var scanner;

var DESCENDANT_COMBINATOR = ' ';
var SPACE_NODE = { type: 'Space' };

var WHITESPACE = TokenType.Whitespace;
var IDENTIFIER = TokenType.Identifier;
var DECIMALNUMBER = TokenType.DecimalNumber;
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
    ruleset: getRuleset,
    selector: getSelector,
    simpleSelector: getSimpleSelector,
    block: getBlock,
    declaration: getDeclaration,
    value: getValue
};

function isNumber(code) {
    return code >= 48 && code <= 57;
}

function getInfo() {
    if (needPositions) {
        return scanner.getLocation(scanner.tokenStart, filename);
    }

    return null;
}

function getStylesheet(nested) {
    var rules = new List();
    var child;
    var node = {
        type: 'StyleSheet',
        info: getInfo(),
        rules: rules
    };

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case WHITESPACE:
                scanner.next();
                continue;

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

            case RIGHTCURLYBRACKET:
                if (!nested) {
                    scanner.error('Unexpected right curly brace');
                }

                break scan;

            default:
                child = getRuleset();
        }

        rules.appendData(child);
    }

    return node;
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
    var sequence = new List();
    var wasSpace = false;
    var child;
    var node = {
        type: 'AtruleExpression',
        info: getInfo(),
        sequence: sequence
    };

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
            if (sequence.head !== null) { // ignore spaces in the beginning
                sequence.appendData(SPACE_NODE);
            }
        }

        sequence.appendData(child);
    }

    return node;
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

    if (!scanner.eof) {
        switch (scanner.tokenType) {
            case SEMICOLON:
                scanner.next();  // {
                break;

            case LEFTCURLYBRACKET:
                scanner.next();  // {

                node.block = isBlockAtrule()
                    ? getBlock()
                    : getStylesheet(true);

                scanner.eat(RIGHTCURLYBRACKET);
                break;

            default:
                scanner.error('Unexpected input');
        }
    }

    return node;
}

function getRuleset() {
    return {
        type: 'Ruleset',
        info: getInfo(),
        selector: getSelector(),
        block: getBlockWithBrackets()
    };
}

function getSelector() {
    var selectors = new List();
    var simpleSelector;
    var isBadSelector = false;
    var lastComma = true;
    var node = {
        type: 'Selector',
        info: getInfo(),
        selectors: selectors
    };

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case LEFTCURLYBRACKET:
                break scan;

            case COMMA:
                if (lastComma) {
                    isBadSelector = true;
                }

                lastComma = true;
                scanner.next();
                break;

            default:
                if (!lastComma) {
                    isBadSelector = true;
                }

                lastComma = false;
                simpleSelector = getSimpleSelector();
                selectors.appendData(simpleSelector);

                if (simpleSelector.sequence.isEmpty()) {
                    isBadSelector = true;
                }
        }
    }

    if (lastComma) {
        isBadSelector = true;
        // scanner.error('Unexpected trailing comma');
    }

    if (isBadSelector) {
        selectors.clear();
    }

    return node;
}

function getSimpleSelector(nested) {
    var sequence = new List();
    var combinator = null;
    var child;
    var node = {
        type: 'SimpleSelector',
        info: getInfo(),
        sequence: sequence
    };

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case COMMA:
                break scan;

            case LEFTCURLYBRACKET:
                if (nested) {
                    scanner.error('Unexpected input');
                }

                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    scanner.error('Unexpected input');
                }

                break scan;

            case COMMENT:
                scanner.next();
                continue;

            case WHITESPACE:
                if (combinator === null && sequence.head !== null) {
                    combinator = getCombinator();
                } else {
                    scanner.next();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
            case SOLIDUS:
                if (combinator !== null && combinator.name !== DESCENDANT_COMBINATOR) {
                    scanner.error('Unexpected combinator');
                }

                combinator = getCombinator();
                continue;

            case FULLSTOP:
                child = getClass();
                break;

            case LEFTSQUAREBRACKET:
                child = getAttribute();
                break;

            case NUMBERSIGN:
                child = getShash();
                break;

            case COLON:
                child = getPseudo();
                break;

            case HYPHENMINUS:
            case IDENTIFIER:
            case ASTERISK:
                child = getNamespacedIdentifier(false);
                break;

            case DECIMALNUMBER:
                child = getPercentage(readNumber());
                break;

            default:
                scanner.error('Unexpected input');
        }

        if (combinator !== null) {
            sequence.appendData(combinator);
            combinator = null;
        }

        sequence.appendData(child);
    }

    if (combinator && combinator.name !== DESCENDANT_COMBINATOR) {
        scanner.error('Unexpected combinator');
    }

    return node;
}

function getDeclarations() {
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

    return declarations;
}

function getBlockWithBrackets() {
    var info = getInfo();
    var declarations;

    scanner.eat(LEFTCURLYBRACKET);
    declarations = getDeclarations();
    scanner.eat(RIGHTCURLYBRACKET);

    return {
        type: 'Block',
        info: info,
        declarations: declarations
    };
}

function getBlock() {
    return {
        type: 'Block',
        info: getInfo(),
        declarations: getDeclarations()
    };
}

function getDeclaration(nested) {
    var info = getInfo();
    var property = readProperty();
    var important = false;
    var value;

    scanner.eat(COLON);
    value = getValue(nested, property);

    if (scanner.tokenType === EXCLAMATIONMARK) {
        important = getImportant();
    }

    return {
        type: 'Declaration',
        info: info,
        important: important,
        property: property,
        value: value
    };
}

function readProperty() {
    var start = scanner.tokenStart;
    var name;

    for (; !scanner.eof; scanner.next()) {
        var type = scanner.tokenType;

        if (type !== SOLIDUS &&
            type !== ASTERISK &&
            type !== DOLLARSIGN) {
            break;
        }
    }

    scanIdent(true);
    name = scanner.substrToCursor(start);

    readSC();

    return name;
}

function getValue(nested, property) {
    // special parser for filter property since it can contains non-standart syntax for old IE
    if (property && endsWith(property, 'filter') && checkProgid()) {
        return getFilterValue();
    }

    var sequence = new List();
    var wasSpace = false;
    var child;
    var node = {
        type: 'Value',
        info: getInfo(),
        sequence: sequence
    };

    readSC();

    scan:
    while (!scanner.eof) {
        switch (scanner.tokenType) {
            case RIGHTCURLYBRACKET:
            case SEMICOLON:
                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    scanner.error('Unexpected input');
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

            case EXCLAMATIONMARK:
                if (nested) {
                    scanner.error('Unexpected exclamation mark');
                }
                break scan;

            case STRING:
                child = getString();
                break;

            default:
                // check for unicode range: U+0F00, U+0F00-0FFF, u+0F00??
                if (scanner.tokenType === IDENTIFIER &&
                    scanner.lookupValue(0, 'u') &&
                    scanner.lookupType(1) === PLUSSIGN) {
                    child = getUnicodeRange();
                } else {
                    child = getAny(SCOPE_VALUE);
                }

        }

        if (wasSpace) {
            wasSpace = false;
            if (sequence.head !== null) { // ignore spaces in the beginning
                sequence.appendData(SPACE_NODE);
            }
        }

        sequence.appendData(child);
    }

    return node;
}

// any = string | percentage | dimension | number | uri | functionExpression | funktion | unary | operator | ident
function getAny(scope) {
    switch (scanner.tokenType) {
        case IDENTIFIER:
            break;

        case FULLSTOP:
        case DECIMALNUMBER:
        case HYPHENMINUS:
        case PLUSSIGN:
            var info = getInfo();
            var number = readNumber();
            var type = scanner.tokenType;

            if (number !== null) {
                if (type === PERCENTSIGN) {
                    return getPercentage(number);
                }

                if (type === IDENTIFIER) {
                    return getDimension(number);
                }

                return {
                    type: 'Number',
                    info: info,
                    value: number
                };
            }

            if (type === HYPHENMINUS) {
                var nextType = scanner.lookupType(1);
                if (nextType === IDENTIFIER || nextType === HYPHENMINUS) {
                    break;
                }
            }

            if (type === HYPHENMINUS ||
                type === PLUSSIGN) {
                return getOperator();
            }

            scanner.error('Unexpected input');

        default:
            scanner.error('Unexpected input');
    }

    var info = getInfo();
    var start = scanner.tokenStart;

    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(scope, info, scanner.substrToCursor(start));
    }

    return {
        type: 'Identifier',
        info: info,
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

    node.name = getNamespacedIdentifier(true);

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
    var sequence = new List();
    var wasSpace = false;
    var child;
    var node = {
        type: 'Parentheses',
        info: getInfo(),
        sequence: sequence
    };

    // left brace
    scanner.next();

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

            case NUMBERSIGN: // ??
                child = getHash();
                break;

            case LEFTPARENTHESIS:
                child = getParentheses(scope);
                break;

            case SOLIDUS:
            case ASTERISK:
            case COMMA:
            case COLON:
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
            if (sequence.head !== null) { // ignore spaces in the beginning
                sequence.appendData(SPACE_NODE);
            }
        }

        sequence.appendData(child);
    }

    // right brace
    scanner.eat(RIGHTPARENTHESIS);

    return node;
}

// '.' ident
function getClass() {
    var info = getInfo();

    scanner.eat(FULLSTOP);

    return {
        type: 'Class',
        info: info,
        name: readIdent(false)
    };
}

// '#' ident
function getShash() {
    var info = getInfo();

    scanner.eat(NUMBERSIGN);

    return {
        type: 'Id',
        info: info,
        name: readIdent(false)
    };
}

// + | > | ~ | /deep/
function getCombinator() {
    var info = getInfo();
    var combinator;

    switch (scanner.tokenType) {
        case WHITESPACE:
            combinator = DESCENDANT_COMBINATOR;
            scanner.next();
            break;

        case PLUSSIGN:
        case TILDE:
        case GREATERTHANSIGN:
            combinator = scanner.getTokenValue();
            scanner.next();
            break;

        case SOLIDUS:
            combinator = '/deep/';

            scanner.next();
            scanner.expectIdentifier('deep');
            scanner.eat(SOLIDUS);
            break;

        default:
            scanner.error('Combinator (+, >, ~, /deep/) is expected');
    }

    return {
        type: 'Combinator',
        info: info,
        name: combinator
    };
}

// '/*' .* '*/'
function getComment() {
    var info = getInfo();
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
        info: info,
        value: scanner.source.substring(start, end)
    };
}

// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
function readUnit() {
    if (scanner.tokenType !== IDENTIFIER) {
        scanner.error('Identifier is expected');
    }

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
function getDimension(number) {
    return {
        type: 'Dimension',
        info: getInfo(),
        value: number,
        unit: readUnit()
    };
}

function getPercentage(number) {
    var info = getInfo();

    scanner.eat(PERCENTSIGN);

    return {
        type: 'Percentage',
        info: info,
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

function getFunctionInternal(readArguments, scope, info, name) {
    var args;

    scanner.eat(LEFTPARENTHESIS);
    args = readArguments(scope);
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: scope === SCOPE_SELECTOR ? 'FunctionalPseudo' : 'Function',
        info: info,
        name: name,
        arguments: args
    };
}

function getFunctionArguments(scope) {
    var args = new List();
    var wasSpace = false;
    var argument = null;
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
                argument = null;
                wasSpace = false;
                scanner.next();
                continue;

            case SOLIDUS:
            case ASTERISK:
            case COLON:
                child = getOperator();
                break;

            case STRING:
                child = getString();
                break;

            default:
                child = getAny(scope);
        }

        if (argument === null) {
            argument = {
                type: 'Argument',
                sequence: new List()
            };

            args.appendData(argument);
        }

        if (wasSpace) {
            wasSpace = false;
            if (argument.sequence.head !== null) { // ignore spaces in the beginning
                argument.sequence.appendData(SPACE_NODE);
            }
        }

        argument.sequence.appendData(child);
    }

    return args;
}

function getVarFunction(scope, info, name) {
    return getFunctionInternal(getVarFunctionArguments, scope, info, name);
}

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
    var args;

    scanner.eat(LEFTPARENTHESIS);
    args = getNotFunctionArguments(scope);
    scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Negation',
        info: info,
        // name: name,    // TODO: add name?
        sequence: args    // FIXME: -> arguments?
    };
}

// var '(' ident (',' <declaration-value>)? ')'
function getVarFunctionArguments() { // TODO: special type Variable?
    var args = new List();

    readSC();

    args.appendData({
        type: 'Argument',
        sequence: new List().appendData(getIdentifier(true))
    });

    readSC();

    if (scanner.tokenType === COMMA) {
        scanner.eat(COMMA);
        readSC();

        args.appendData({
            type: 'Argument',
            sequence: new List().appendData(getValue(true))
        });

        readSC();
    }

    return args;
}

// url '(' ws* (string | raw) ws* ')'
function getUri(scope, info) {
    var node = {
        type: 'Url',
        info: info,
        value: null
    };

    scanner.eat(LEFTPARENTHESIS); // (
    readSC();

    if (scanner.tokenType === STRING) {
        node.value = getString();
    } else {
        var rawInfo = getInfo();
        var start = scanner.tokenStart;

        for (; !scanner.eof; scanner.next()) {
            var type = scanner.tokenType;

            if (type === WHITESPACE ||
                type === LEFTPARENTHESIS ||
                type === RIGHTPARENTHESIS) {
                break;
            }
        }

        node.value = {
            type: 'Raw',
            info: rawInfo,
            value: scanner.substrToCursor(start)
        };
    }

    readSC();
    scanner.eat(RIGHTPARENTHESIS); // )

    return node;
}

// expression '(' raw ')'
function getOldIEExpression(scope, info, name) {
    scanner.eat(LEFTPARENTHESIS);

    var start = scanner.tokenStart;
    var raw;

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
        arguments: new List().appendData({
            type: 'Argument',
            sequence: new List().appendData({
                type: 'Raw',
                value: raw
            })
        })
    };
}

function scanUnicodeRange() {
    var hexStart = scanner.tokenStart;
    var hexLength = 0;

    if (scanner.tokenType === DECIMALNUMBER) {
        scanner.next();
    }

    if (scanner.tokenType === HYPHENMINUS) {
        scanner.next();
    }

    if (scanner.tokenType === DECIMALNUMBER) {
        scanner.next();
    }

    if (scanner.tokenType === IDENTIFIER) {
        scanner.next();
    }

    hexLength = scanner.tokenStart - hexStart;

    if (hexLength === 0) {
        scanner.error('Unexpected input', hexStart);
    }

    // validate hex for U+xxxxxx or U+xxxxxx-xxxxxx
    // TODO: check hex sequence length
    for (var i = hexStart, wasHyphenMinus = false; i < scanner.tokenStart; i++) {
        var code = scanner.source.charCodeAt(i);

        if (isHex(code) === false && (code !== HYPHENMINUS || wasHyphenMinus)) {
            scanner.error('Unexpected input', hexStart + i);
        }

        if (code === HYPHENMINUS) {
            wasHyphenMinus = true;
        }
    }

    // U+abc???
    if (!wasHyphenMinus) {
        for (; hexLength < 6 && !scanner.eof; scanner.next()) {
            if (scanner.tokenType !== QUESTIONMARK) {
                break;
            }

            hexLength++;
        }
    }

    return hexLength;
}

function getUnicodeRange() {
    var start = scanner.tokenStart;
    var info = getInfo();

    scanner.skip(2); // U+ or u+
    scanUnicodeRange();

    return {
        type: 'UnicodeRange',
        info: info,
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

function getNamespacedIdentifier(checkColon) {
    if (scanner.eof) {
        scanner.error('Unexpected end of input');
    }

    var info = getInfo();
    var start = scanner.tokenStart;

    if (scanner.tokenType === ASTERISK) {
        checkColon = false;
        scanner.next();
    } else {
        scanIdent(false);
    }

    if (scanner.tokenType === VERTICALLINE && scanner.lookupType(1) !== EQUALSSIGN) {
        scanner.next();

        if (scanner.tokenType === HYPHENMINUS || scanner.tokenType === IDENTIFIER) {
            scanIdent(false);
        } else if (scanner.tokenType === ASTERISK) {
            checkColon = false;
            scanner.next();
        }
    }

    if (checkColon && scanner.tokenType === COLON) {
        scanner.next();
        scanIdent(false);
    }

    return {
        type: 'Identifier',
        info: info,
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

function getNthSelector() {
    var info = getInfo();
    var sequence = new List();
    var node;

    scanner.eat(COLON);

    node = {
        type: 'FunctionalPseudo',
        info: info,
        name: readIdent(false),
        arguments: new List().appendData({
            type: 'Argument',
            sequence: sequence
        })
    };

    scanner.eat(LEFTPARENTHESIS);
    readSC();

    if (scanner.lookupValue(0, 'odd') || scanner.lookupValue(0, 'even')) {
        var start = scanner.tokenStart;
        var info = getInfo();

        scanner.next();
        sequence.appendData({
            type: 'Nth',
            info: getInfo(),
            value: scanner.substrToCursor(start)
        });
    } else {
        if (scanner.tokenType === HYPHENMINUS ||
            scanner.tokenType === PLUSSIGN) {
            sequence.appendData(getOperator());
            readSC();
        }

        var start = scanner.tokenStart;
        var info = getInfo();

        if (scanner.tokenType === DECIMALNUMBER) {
            scanner.next();
        }

        if (scanner.tokenType === IDENTIFIER) {
            if (!cmpStr(scanner.source, scanner.tokenStart, scanner.tokenStart + 1, 'n')) {
                scanner.error('Unexpected input');
            }

            sequence.appendData({
                type: 'Nth',
                info: info,
                value: scanner.source.substring(start, scanner.tokenStart + 1)
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
                    readSC();

                    sequence.appendData({
                        type: 'Nth',
                        info: getInfo(),
                        value: scanner.getTokenValue()
                    });
                    scanner.eat(DECIMALNUMBER);
                }

            } else {
                scanner.next();
                readSC();

                if (scanner.tokenType === HYPHENMINUS ||
                    scanner.tokenType === PLUSSIGN) {
                    sequence.appendData(getOperator());

                    readSC();

                    sequence.appendData({
                        type: 'Nth',
                        info: getInfo(),
                        value: scanner.getTokenValue()
                    });
                    scanner.eat(DECIMALNUMBER);
                }
            }
        } else {
            if (scanner.tokenStart === start) { // no number
                scanner.error('Number or identifier is expected');
            }

            sequence.appendData({
                type: 'Nth',
                info: info,
                value: scanner.substrToCursor(start)
            });
        }
    }

    readSC();
    scanner.eat(RIGHTPARENTHESIS);

    return node;
}

function readNumber() {
    var start = scanner.tokenStart;
    var wasDigits = false;
    var offset = 0;
    var tokenType = scanner.tokenType;

    if (tokenType === HYPHENMINUS) {
        tokenType = scanner.lookupType(++offset);
    }

    if (tokenType === DECIMALNUMBER) {
        wasDigits = true;
        tokenType = scanner.lookupType(++offset);
    }

    if (tokenType === FULLSTOP) {
        tokenType = scanner.lookupType(++offset);
    }

    if (tokenType === DECIMALNUMBER) {
        wasDigits = true;
        offset++;
    }

    if (wasDigits) {
        scanner.skip(offset);

        return scanner.substrToCursor(start);
    }

    return null;
}

// '/' | '*' | ',' | ':' | '+' | '-'
function getOperator() {
    var node = {
        type: 'Operator',
        info: getInfo(),
        value: scanner.getTokenValue()
    };

    scanner.next();

    return node;
}

function getFilterValue() { // TODO
    var sequence = new List();
    var progid;
    var node = {
        type: 'Value',
        info: getInfo(),
        sequence: sequence
    };

    while (progid = checkProgid()) {
        sequence.appendData(getProgid(progid));
    }

    readSC();

    return node;
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid() {
    function checkSC(offset) {
        for (var type; type = scanner.lookupType(offset); offset++) {
            if (type !== WHITESPACE && type !== COMMENT) {
                break;
            }
        }

        return offset;
    }

    var startOffset = checkSC(0);
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
        offset = checkSC(offset);

        if (scanner.lookupValue(offset + 0, 'dximagetransform') === false ||
            scanner.lookupType(offset + 1) !== FULLSTOP ||
            scanner.lookupValue(offset + 2, 'microsoft') === false ||
            scanner.lookupType(offset + 3) !== FULLSTOP ||
            scanner.lookupType(offset + 4) !== IDENTIFIER) {
            return false; // fail
        }

        offset += 5;
        offset = checkSC(offset);
    }

    if (scanner.lookupType(offset) !== LEFTPARENTHESIS) {
        return false; // fail
    }

    for (var type; type = scanner.lookupType(offset); offset++) {
        if (type === RIGHTPARENTHESIS) {
            return offset - startOffset;
        }
    }

    return false;
}

function getProgid(progidEnd) {
    var node = {
        type: 'Progid',
        info: getInfo(),
        value: null
    };

    readSC();

    var rawInfo = getInfo();
    var start = scanner.tokenStart;

    scanner.skip(progidEnd);
    scanner.eat(RIGHTPARENTHESIS);

    node.value = {
        type: 'Raw',
        info: rawInfo,
        value: scanner.substrToCursor(start)
    };

    readSC();

    return node;
}

// <pseudo-element> | <nth-selector> | <pseudo-class>
function getPseudo() {
    var nextType = scanner.lookupType(1);

    if (nextType === COLON) {
        return getPseudoElement();
    }

    if (nextType === IDENTIFIER && cmpStr(scanner.source, scanner.tokenEnd, scanner.tokenEnd + 4, 'nth-')) {
        return getNthSelector();
    }

    return getPseudoClass();
}

// :: ident
function getPseudoElement() {
    var info = getInfo();

    scanner.eat(COLON);
    scanner.eat(COLON);

    return {
        type: 'PseudoElement',
        info: info,
        name: readIdent(false)
    };
}

// : ( ident | function )
function getPseudoClass() {
    var info = getInfo();
    var start = scanner.tokenStart + 1;

    scanner.eat(COLON);
    scanIdent(false);

    if (scanner.tokenType === LEFTPARENTHESIS) {
        return getFunction(SCOPE_SELECTOR, info, scanner.substrToCursor(start));
    }

    return {
        type: 'PseudoClass',
        info: info,
        name: scanner.substrToCursor(start)
    };
}

function readSC() {
    while (scanner.tokenType === WHITESPACE || scanner.tokenType === COMMENT) {
        scanner.next();
    }

    return null;
}

// node: String
function getString() {
    var node = {
        type: 'String',
        info: getInfo(),
        value: scanner.getTokenValue()
    };

    scanner.next();

    return node;
}

// # ident
function getHash() {
    var info = getInfo();
    var start = scanner.tokenStart + 1;

    scanner.eat(NUMBERSIGN);

    if (scanner.tokenType !== DECIMALNUMBER &&
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
        info: info,
        value: scanner.substrToCursor(start)
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
        ast = initialContext.value(false, options.property);
    } else {
        ast = initialContext[context]();
    }

    scanner = null;

    // console.log(JSON.stringify(ast, null, 4));
    return ast;
};

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parse('a.b#c:e:NOT(a)::g,* b>c+d~e/deep/f,100%{v:1 2em t a(2%, var(--a)) url(..) -foo-bar !important}');

module.exports = parse;
