var tokenizerUtils = require('../tokenizer/utils');
var isIdentifierStart = tokenizerUtils.isIdentifierStart;
var isHexDigit = tokenizerUtils.isHexDigit;
var isDigit = tokenizerUtils.isDigit;
var cmpStr = tokenizerUtils.cmpStr;
var consumeNumber = tokenizerUtils.consumeNumber;
var TYPE = require('../tokenizer/const').TYPE;
var urange = require('./generic-urange');

var cssWideKeywords = ['unset', 'initial', 'inherit'];
var calcFunctionNames = ['calc(', '-moz-calc(', '-webkit-calc('];

// https://www.w3.org/TR/css-values-3/#lengths
var LENGTH = {
    // absolute length units
    'px': true,
    'mm': true,
    'cm': true,
    'in': true,
    'pt': true,
    'pc': true,
    'q': true,

    // relative length units
    'em': true,
    'ex': true,
    'ch': true,
    'rem': true,

    // viewport-percentage lengths
    'vh': true,
    'vw': true,
    'vmin': true,
    'vmax': true,
    'vm': true
};

var ANGLE = {
    'deg': true,
    'grad': true,
    'rad': true,
    'turn': true
};

var TIME = {
    's': true,
    'ms': true
};

var FREQUENCY = {
    'hz': true,
    'khz': true
};

// https://www.w3.org/TR/css-values-3/#resolution (https://drafts.csswg.org/css-values/#resolution)
var RESOLUTION = {
    'dpi': true,
    'dpcm': true,
    'dppx': true,
    'x': true      // https://github.com/w3c/csswg-drafts/issues/461
};

// https://drafts.csswg.org/css-grid/#fr-unit
var FLEX = {
    'fr': true
};

// https://www.w3.org/TR/css3-speech/#mixing-props-voice-volume
var DECIBEL = {
    'db': true
};

// https://www.w3.org/TR/css3-speech/#voice-props-voice-pitch
var SEMITONES = {
    'st': true
};

// safe char code getter
function charCode(str, index) {
    return index < str.length ? str.charCodeAt(index) : 0;
}

function eqStr(actual, expected) {
    return cmpStr(actual, 0, actual.length, expected);
}

function eqStrAny(actual, expected) {
    for (var i = 0; i < expected.length; i++) {
        if (eqStr(actual, expected[i])) {
            return true;
        }
    }

    return false;
}

// IE postfix hack, i.e. 123\0 or 123px\9
function isPostfixIeHack(str, offset) {
    if (offset !== str.length - 2) {
        return false;
    }

    return (
        str.charCodeAt(offset) === 0x005C &&  // U+005C REVERSE SOLIDUS (\)
        isDigit(str.charCodeAt(offset + 1))
    );
}

function consumeFunction(token, getNextToken) {
    var startIdx = token.index;
    var length = 0;

    // balanced token consuming
    do {
        length++;

        if (token.balance <= startIdx) {
            break;
        }
    } while (token = getNextToken(length));

    return length;
}

// TODO: implement
// can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
// https://drafts.csswg.org/css-values/#calc-notation
function calc(next) {
    return function(token, getNextToken) {
        if (token === null) {
            return 0;
        }

        if (token.type === TYPE.Function && eqStrAny(token.value, calcFunctionNames)) {
            return consumeFunction(token, getNextToken);
        }

        return next(token, getNextToken);
    };
}

function tokenType(expectedTokenType) {
    return function(token) {
        if (token === null || token.type !== expectedTokenType) {
            return 0;
        }

        return 1;
    };
}

function func(name) {
    name = name + '(';

    return function(token, getNextToken) {
        if (token !== null && eqStr(token.value, name)) {
            return consumeFunction(token, getNextToken);
        }

        return 0;
    };
}

// =========================
// Complex types
//

// https://drafts.csswg.org/css-values-4/#custom-idents
// 4.2. Author-defined Identifiers: the <custom-ident> type
// Some properties accept arbitrary author-defined identifiers as a component value.
// This generic data type is denoted by <custom-ident>, and represents any valid CSS identifier
// that would not be misinterpreted as a pre-defined keyword in that property’s value definition.
//
// See also: https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
function customIdent(token) {
    if (token === null || token.type !== TYPE.Ident) {
        return 0;
    }

    var name = token.value.toLowerCase();

    // The CSS-wide keywords are not valid <custom-ident>s
    if (eqStrAny(name, cssWideKeywords)) {
        return 0;
    }

    // The default keyword is reserved and is also not a valid <custom-ident>
    if (eqStr(name, 'default')) {
        return 0;
    }

    // TODO: ignore property specific keywords (as described https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident)
    // Specifications using <custom-ident> must specify clearly what other keywords
    // are excluded from <custom-ident>, if any—for example by saying that any pre-defined keywords
    // in that property’s value definition are excluded. Excluded keywords are excluded
    // in all ASCII case permutations.

    return 1;
}

function hexColor(token) {
    if (token === null || token.type !== TYPE.Hash) {
        return 0;
    }

    var length = token.value.length;

    // valid values (length): #rgb (4), #rgba (5), #rrggbb (7), #rrggbbaa (9)
    if (length !== 4 && length !== 5 && length !== 7 && length !== 9) {
        return 0;
    }

    for (var i = 1; i < length; i++) {
        if (!isHexDigit(token.value.charCodeAt(i))) {
            return 0;
        }
    }

    return 1;
}

function idSelector(token) {
    if (token === null || token.type !== TYPE.Hash) {
        return 0;
    }

    if (!isIdentifierStart(charCode(token.value, 1), charCode(token.value, 2), charCode(token.value, 3))) {
        return 0;
    }

    return 1;
}

function url(token, getNextToken) {
    if (token === null) {
        return 0;
    }

    if (token.type === TYPE.Function && eqStr(token.value, 'url(')) {
        return consumeFunction(token, getNextToken);
    }

    if (token.type !== TYPE.Url) {
        return 0;
    }

    return 1;
}

// https://drafts.csswg.org/css-syntax/#any-value
// It represents the entirety of what a valid declaration can have as its value.
function declarationValue(token, getNextToken) {
    if (!token) {
        return 0;
    }

    var length = 0;
    var level = 0;
    var startIdx = token.index;

    // The <declaration-value> production matches any sequence of one or more tokens,
    // so long as the sequence ...
    scan:
    do {
        switch (token.type) {
            // ... does not contain <bad-string-token>, <bad-url-token>,
            case TYPE.BadString:
            case TYPE.BadUrl:
                break scan;

            // ... unmatched <)-token>, <]-token>, or <}-token>,
            case TYPE.RightCurlyBracket:
            case TYPE.RightParenthesis:
            case TYPE.RightSquareBracket:
                if (token.balance > token.index || token.balance <= startIdx) {
                    break scan;
                }

                level--;
                break;

            // ... or top-level <semicolon-token> tokens
            case TYPE.Semicolon:
                if (level === 0) {
                    break scan;
                }

                break;

            // ... or <delim-token> tokens with a value of "!"
            case TYPE.Delim:
                if (token.value === '!' && level === 0) {
                    break scan;
                }

                break;

            case TYPE.Function:
            case TYPE.LeftParenthesis:
            case TYPE.LeftSquareBracket:
            case TYPE.LeftCurlyBracket:
                level++;
                break;
        }

        length++;

        // until balance closing
        if (token.balance <= startIdx) {
            break;
        }
    } while (token = getNextToken(length));

    return length;
}

// https://drafts.csswg.org/css-syntax/#any-value
// The <any-value> production is identical to <declaration-value>, but also
// allows top-level <semicolon-token> tokens and <delim-token> tokens
// with a value of "!". It represents the entirety of what valid CSS can be in any context.
function anyValue(token, getNextToken) {
    if (!token) {
        return 0;
    }

    var startIdx = token.index;
    var length = 0;

    // The <any-value> production matches any sequence of one or more tokens,
    // so long as the sequence ...
    scan:
    do {
        switch (token.type) {
            // ... does not contain <bad-string-token>, <bad-url-token>,
            case TYPE.BadString:
            case TYPE.BadUrl:
                break scan;

            // ... unmatched <)-token>, <]-token>, or <}-token>,
            case TYPE.RightCurlyBracket:
            case TYPE.RightParenthesis:
            case TYPE.RightSquareBracket:
                if (token.balance > token.index || token.balance <= startIdx) {
                    break scan;
                }

                break;
        }

        length++;

        // until balance closing
        if (token.balance <= startIdx) {
            break;
        }
    } while (token = getNextToken(length));

    return length;
}

function astNode(type) {
    return function(token, getNextToken) {
        var length = 0;
        var cursor = null;

        if (token === null || token.node.type !== type) {
            return 0;
        }

        do {
            cursor = getNextToken(++length);
        } while (cursor !== null && cursor.node === token.node);

        return length;
    };
}

// =========================
// Dimensions
//

function dimension(type) {
    return function(token) {
        if (token === null || token.type !== TYPE.Dimension) {
            return false;
        }

        var numberEnd = consumeNumber(token.value, 0);
        // check for IE postfix hack, i.e. 123px\0 or 123px\9
        var reverseSolidusOffset = token.value.indexOf('\\', numberEnd);
        var unit = reverseSolidusOffset === -1 || !isPostfixIeHack(token.value, reverseSolidusOffset)
            ? token.value.substr(numberEnd)
            : token.value.substring(numberEnd, reverseSolidusOffset);

        if (!type.hasOwnProperty(unit.toLowerCase())) {
            return 0;
        }

        return 1;
    };
}

// =========================
// Numeric
//

function zero(next) {
    if (typeof next !== 'function') {
        next = function() {
            return 0;
        };
    }

    return function(token, getNextToken) {
        if (token !== null && token.type === TYPE.Number) {
            if (Number(token.value) === 0) {
                return 1;
            }
        }

        return next(token, getNextToken);
    };
}

function number(token) {
    if (token === null) {
        return 0;
    }

    var numberEnd = consumeNumber(token.value, 0);
    if (numberEnd !== token.value.length && !isPostfixIeHack(token.value, numberEnd)) {
        return 0;
    }

    return 1;
}

function numberZeroOne(token) {
    if (token === null || token.type !== TYPE.Number) {
        return 0;
    }

    var value = Number(token.value);
    if (value < 0 || value > 1) {
        return 0;
    }

    return 1;
}

function numberOneOrGreater(token) {
    if (token === null || token.type !== TYPE.Number) {
        return 0;
    }

    var value = Number(token.value);
    if (value < 1) {
        return 0;
    }

    return 1;
}

// TODO: fail on 10e-2
function integer(token) {
    if (token === null || token.type !== TYPE.Number) {
        return 0;
    }

    if (token.value.indexOf('.') !== -1) {
        return 0;
    }

    return 1;
}

function positiveInteger(token) {
    if (token === null || token.type !== TYPE.Number) {
        return 0;
    }

    for (var i = 0; i < token.value.length; i++) {
        if (!isDigit(token.value.charCodeAt(i))) {
            return 0;
        }
    }

    return 1;
}

module.exports = {
    // token types
    'ident-token': tokenType(TYPE.Ident),
    'function-token': tokenType(TYPE.Function),
    'at-keyword-token': tokenType(TYPE.AtKeyword),
    'hash-token': tokenType(TYPE.Hash),
    'string-token': tokenType(TYPE.String),
    'bad-string-token': tokenType(TYPE.BadString),
    'url-token': tokenType(TYPE.Url),
    'bad-url-token': tokenType(TYPE.BadUrl),
    'delim-token': tokenType(TYPE.Delim),
    'number-token': tokenType(TYPE.Number),
    'percentage-token': tokenType(TYPE.Percentage),
    'dimension-token': tokenType(TYPE.Dimension),
    'whitespace-token': tokenType(TYPE.WhiteSpace),
    'CDO-token': tokenType(TYPE.CDO),
    'CDC-token': tokenType(TYPE.CDC),
    'colon-token': tokenType(TYPE.Colon),
    'semicolon-token': tokenType(TYPE.Semicolon),
    'comma-token': tokenType(TYPE.Comma),
    '[-token': tokenType(TYPE.LeftSquareBracket),
    ']-token': tokenType(TYPE.RightSquareBracket),
    '(-token': tokenType(TYPE.LeftParenthesis),
    ')-token': tokenType(TYPE.RightParenthesis),
    '{-token': tokenType(TYPE.LeftCurlyBracket),
    '}-token': tokenType(TYPE.RightCurlyBracket),

    // token type aliases
    'dimension': tokenType(TYPE.Dimension),
    'string': tokenType(TYPE.String),
    'ident': tokenType(TYPE.Ident),

    // complex types
    'custom-ident': customIdent,
    'hex-color': hexColor,
    'id-selector': idSelector, // element( <id-selector> )
    'urange': urange,
    'unicode-range': urange, // TODO: remove, since deprecated, but left since may be used in old syntaxes
    'url': url, // TODO: <url-token> | url( <string> <url-modifier>* )
    'declaration-value': declarationValue,
    'any-value': anyValue,

    // dimensions
    'angle': calc(zero(dimension(ANGLE))),
    'decibel': calc(dimension(DECIBEL)),
    'frequency': calc(dimension(FREQUENCY)),
    'flex': calc(dimension(FLEX)),
    'length': calc(zero(dimension(LENGTH))),
    'percentage': calc(tokenType(TYPE.Percentage)),
    'resolution': calc(dimension(RESOLUTION)),
    'semitones': calc(dimension(SEMITONES)),
    'time': calc(dimension(TIME)),

    // numeric
    'zero': zero(),
    'number': calc(number),
    'number-zero-one': calc(numberZeroOne),
    'number-one-or-greater': calc(numberOneOrGreater),
    'integer': calc(integer),
    'positive-integer': calc(positiveInteger),

    // hacks
    'attr()': func('attr'),    // TODO: remove

    // old IE stuff
    'progid': astNode('Raw'),
    '-ms-legacy-expression': func('expression')
};
