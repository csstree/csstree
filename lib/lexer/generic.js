var tokenizerUtils = require('../tokenizer/utils');
var isIdentifierStart = tokenizerUtils.isIdentifierStart;
var isHexDigit = tokenizerUtils.isHexDigit;
var isDigit = tokenizerUtils.isDigit;
var cmpStr = tokenizerUtils.cmpStr;
var consumeNumber = tokenizerUtils.consumeNumber;
var TYPE = require('../tokenizer/const').TYPE;

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

function consumeFunction(token, addTokenToMatch, getNextToken) {
    var length = 1;
    var cursor;

    do {
        cursor = getNextToken(length++);
    } while (cursor !== null && cursor.node !== token.node);

    if (cursor === null) {
        return false;
    }

    while (true) {
        // consume tokens until cursor
        if (addTokenToMatch() === cursor) {
            break;
        }
    }

    return true;
}

// TODO: implement
// can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
// https://drafts.csswg.org/css-values/#calc-notation
function calc(next) {
    return function(token, addTokenToMatch, getNextToken) {
        if (token === null) {
            return false;
        }

        if (token.type === TYPE.Function && eqStrAny(token.value, calcFunctionNames)) {
            return consumeFunction(token, addTokenToMatch, getNextToken);
        }

        return next(token, addTokenToMatch, getNextToken);
    };
}

function tokenType(expectedTokenType) {
    return function(token, addTokenToMatch) {
        if (token === null || token.type !== expectedTokenType) {
            return false;
        }

        addTokenToMatch();
        return true;
    }
}

function func(name) {
    name = name + '(';

    return function(token, addTokenToMatch, getNextToken) {
        if (token !== null && eqStr(token.value, name)) {
            return consumeFunction(token, addTokenToMatch, getNextToken)
        }

        return false;
    };
}

function url(token, addTokenToMatch, getNextToken) {
    if (token === null) {
        return false;
    }

    if (token.type === TYPE.Function && eqStr(token.value, 'url(')) {
        return consumeFunction(token, addTokenToMatch, getNextToken);
    }

    if (token.type !== TYPE.Url) {
        return false;
    }

    addTokenToMatch();
    return true;
}

function idSelector(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Hash) {
        return false;
    }

    if (!isIdentifierStart(charCode(token.value, 1), charCode(token.value, 2), charCode(token.value, 3))) {
        return false;
    }

    addTokenToMatch();
    return true;
}

function astNode(type) {
    return function(token, addTokenToMatch, getNextToken) {
        var length = 0;
        var cursor = null;

        if (token === null || token.node.type !== type) {
            return false;
        }

        do {
            cursor = getNextToken(++length);
        } while (cursor !== null && cursor.node === token.node);
    
        for (var i = 0; i < length; i++) {
            // consume tokens until cursor
            addTokenToMatch();
        }

        return true;
    };
}

function dimension(type) {
    return function(token, addTokenToMatch) {
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
            return false;
        }

        addTokenToMatch();
        return true;
    };
}

function zero(next) {
    return function(token, addTokenToMatch, getNextToken) {
        if (token !== null && token.type === TYPE.Number) {
            if (Number(token.value) === 0) {
                addTokenToMatch();
                return true;
            }
        }

        return next(token, addTokenToMatch, getNextToken);
    };
}

function number(token, addTokenToMatch) {
    if (token === null) {
        return false;
    }

    var numberEnd = consumeNumber(token.value, 0);
    if (numberEnd !== token.value.length && !isPostfixIeHack(token.value, numberEnd)) {
        return false;
    }

    addTokenToMatch();
    return true;
}

function numberZeroOne(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Number) {
        return false;
    }

    var value = Number(token.value);
    if (value < 0 || value > 1) {
        return false;
    }

    addTokenToMatch();
    return true;
}

function numberOneOrGreater(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Number) {
        return false;
    }

    var value = Number(token.value);
    if (value < 1) {
        return false;
    }

    addTokenToMatch();
    return true;
}

// TODO: fail on 10e-2
function integer(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Number) {
        return false;
    }

    if (token.value.indexOf('.') !== -1) {
        return false;
    }

    addTokenToMatch();
    return true;
}

function positiveInteger(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Number) {
        return false;
    }

    for (var i = 0; i < token.value.length; i++) {
        if (!isDigit(token.value.charCodeAt(i))) {
            return false;
        }
    }

    addTokenToMatch();
    return true;
}

function hexColor(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Hash) {
        return false;
    }

    var length = token.value.length;

    // valid values (length): #rgb (4), #rgba (5), #rrggbb (7), #rrggbbaa (9)
    if (length !== 4 && length !== 5 && length !== 7 && length !== 9) {
        return false;
    }

    for (var i = 1; i < length; i++) {
        if (!isHexDigit(token.value.charCodeAt(i))) {
            return false;
        }
    }

    addTokenToMatch();
    return true;
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
// https://drafts.csswg.org/css-values-4/#identifier-value
function customIdent(token, addTokenToMatch) {
    if (token === null || token.type !== TYPE.Ident) {
        return false;
    }

    var name = token.value.toLowerCase();

    // § 3.2. Author-defined Identifiers: the <custom-ident> type
    // The CSS-wide keywords are not valid <custom-ident>s
    if (eqStrAny(name, cssWideKeywords)) {
        return false;
    }

    // The default keyword is reserved and is also not a valid <custom-ident>
    if (eqStr(name, 'default')) {
        return false;
    }

    // TODO: ignore property specific keywords (as described https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident)

    addTokenToMatch();
    return true;
}

module.exports = {
    'angle': calc(zero(dimension(ANGLE))),
    'attr()': func('attr'),
    'custom-ident': customIdent,
    'decibel': calc(dimension(DECIBEL)),
    'dimension': tokenType(TYPE.Dimension),
    'frequency': calc(dimension(FREQUENCY)),
    'flex': calc(dimension(FLEX)),
    'hex-color': hexColor,
    'id-selector': idSelector, // element( <id-selector> )
    'ident': tokenType(TYPE.Ident),
    'integer': calc(integer),
    'length': calc(zero(dimension(LENGTH))),
    'number': calc(number),
    'number-zero-one': calc(numberZeroOne),
    'number-one-or-greater': calc(numberOneOrGreater),
    'percentage': calc(tokenType(TYPE.Percentage)),
    'positive-integer': calc(positiveInteger),
    'resolution': calc(dimension(RESOLUTION)),
    'semitones': calc(dimension(SEMITONES)),
    'string': tokenType(TYPE.String),
    'time': calc(dimension(TIME)),
    'unicode-range': astNode('UnicodeRange'),
    'url': url,

    // old IE stuff
    'progid': astNode('Raw'),
    'expression': func('expression')
};
