var PERCENTAGE = {
    '%': true
};

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

function consumeFunction(token, addTokenToStack, getNextToken) {
    var next = getNextToken(1);

    if (next === null || next.value !== '(') {
        return false;
    }

    var length = 2;
    var cursor;

    do {
        cursor = getNextToken(length++);
    } while (cursor !== null && cursor.node !== token.node);

    if (cursor === null) {
        return false;
    }

    while (true) {
        // consume tokens until cursor
        if (addTokenToStack() === cursor) {
            break;
        }
    }

    return true;
}

// TODO: implement
// can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
// https://drafts.csswg.org/css-values/#calc-notation
function calc(token, addTokenToStack, getNextToken) {
    if (!token || token.node.type !== 'Function') {
        return false;
    }

    var name = token.value.toLowerCase();

    if (name !== 'calc' &&
        name !== '-moz-calc' &&
        name !== '-webkit-calc') {
        return false;
    }

    return consumeFunction(token, addTokenToStack, getNextToken);
}

function attr(token, addTokenToStack, getNextToken) {
    if (!token || token.node.type !== 'Function' || token.value.toLowerCase() !== 'attr') {
        return false;
    }

    return consumeFunction(token, addTokenToStack, getNextToken);
}

function expression(token, addTokenToStack, getNextToken) {
    if (!token || token.node.type !== 'Function' || token.value.toLowerCase() !== 'expression') {
        return false;
    }

    return consumeFunction(token, addTokenToStack, getNextToken);
}

function url(token, addTokenToStack, getNextToken) {
    if (!token || token.node.type !== 'Url') {
        return false;
    }

    return consumeFunction(token, addTokenToStack, getNextToken);
}

function idSelector(token, addTokenToStack) {
    if (!token || token.value !== '#' || token.node.type !== 'IdSelector') {
        return false;
    }

    addTokenToStack();
    addTokenToStack();
    return true;
}

function isNumber(str) {
    return /^[-+]?(\d+|\d*\.\d+)([eE][-+]?\d+)?$/.test(str);
}

function astNode(type) {
    return function(token, addTokenToStack) {
        if (token === null || token.node.type !== type) {
            return false;
        }

        addTokenToStack();
        return true;
    };
}

function dimension(type) {
    return function(token, addTokenToStack, getNextToken) {
        if (calc(token, addTokenToStack, getNextToken)) {
            return true;
        }

        if (token === null) {
            return false;
        }

        var number = token.value;
        var unit = getNextToken(1);

        if (unit === null) {
            return false;
        }

        unit = unit.value;

        if (!isNumber(number)) {
            return false;
        }

        if (type && !type.hasOwnProperty(unit.toLowerCase())) {
            return false;
        }

        addTokenToStack();
        addTokenToStack();
        return true;
    };
}

function zeroUnitlessDimension(type) {
    var isDimension = dimension(type);

    return function(token, addTokenToStack, getNextToken) {
        if (isDimension(token, addTokenToStack, getNextToken)) {
            return true;
        }

        if (token === null || Number(token.value) !== 0) {
            return false;
        }

        addTokenToStack();
        return true;
    };
}

function number(token, addTokenToStack, getNextToken) {
    if (calc(token, addTokenToStack, getNextToken)) {
        return true;
    }

    if (token === null || !isNumber(token.value)) {
        return false;
    }

    addTokenToStack();
    return true;
}

function numberZeroOne(token, addTokenToStack, getNextToken) {
    if (calc(token, addTokenToStack, getNextToken)) {
        return true;
    }

    if (token === null || !isNumber(token.value)) {
        return false;
    }

    var value = Number(token.value);

    if (value < 0 || value > 1) {
        return false;
    }

    addTokenToStack();
    return true;
}

function numberOneOrGreater(token, addTokenToStack, getNextToken) {
    if (calc(token, addTokenToStack, getNextToken)) {
        return true;
    }

    if (token === null || !isNumber(token.value)) {
        return false;
    }

    var value = Number(token.value);

    if (value < 1) {
        return false;
    }

    addTokenToStack();
    return true;
}

// TODO: fail on 10e-2
function integer(token, addTokenToStack, getNextToken) {
    if (calc(token, addTokenToStack, getNextToken)) {
        return true;
    }

    if (token === null || !isNumber(token.value) || token.value.indexOf('.') !== -1) {
        return false;
    }

    addTokenToStack();
    return true;
}

// TODO: fail on 10e-2
function positiveInteger(token, addTokenToStack, getNextToken) {
    if (calc(token, addTokenToStack, getNextToken)) {
        return true;
    }

    if (token === null || !isNumber(token.value) || token.value.indexOf('.') !== -1 || token.value.charAt(0) === '-') {
        return false;
    }

    addTokenToStack();
    return true;
}

function hexColor(token, addTokenToStack, getNextToken) {
    if (token === null || token.value !== '#') {
        return false;
    }

    var next = getNextToken(1);

    if (next === null) {
        return false;
    }

    var hex = next.value;

    // valid length is 3, 4, 6 and 8
    if (hex.length !== 3 && hex.length !== 4 && hex.length !== 6 && hex.length !== 8) {
        return false;
    }

    if (/[^0-9a-fA-F]/.test(hex)) {
        return false;
    }

    addTokenToStack();
    addTokenToStack();
    return true;
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
// https://drafts.csswg.org/css-values-4/#identifier-value
function customIdent(token, addTokenToStack) {
    if (token === null || !/^[a-z-][a-z0-9-$]*$/i.test(token.value)) {
        return false;
    }

    var name = token.value.toLowerCase();

    // § 3.2. Author-defined Identifiers: the <custom-ident> type
    // The CSS-wide keywords are not valid <custom-ident>s
    if (name === 'unset' || name === 'initial' || name === 'inherit') {
        return false;
    }

    // The default keyword is reserved and is also not a valid <custom-ident>
    if (name === 'default') {
        return false;
    }

    // TODO: ignore property specific keywords (as described https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident)

    addTokenToStack();
    return true;
}

module.exports = {
    'angle': zeroUnitlessDimension(ANGLE),
    'attr()': attr,
    'custom-ident': customIdent,
    'decibel': dimension(DECIBEL),
    'dimension': dimension(),
    'frequency': dimension(FREQUENCY),
    'flex': dimension(FLEX),
    'hex-color': hexColor,
    'id-selector': idSelector, // element( <id-selector> )
    'ident': astNode('Identifier'),
    'integer': integer,
    'length': zeroUnitlessDimension(LENGTH),
    'number': number,
    'number-zero-one': numberZeroOne,
    'number-one-or-greater': numberOneOrGreater,
    'percentage': dimension(PERCENTAGE),
    'positive-integer': positiveInteger,
    'resolution': dimension(RESOLUTION),
    'semitones': dimension(SEMITONES),
    'string': astNode('String'),
    'time': dimension(TIME),
    'unicode-range': astNode('UnicodeRange'),
    'url': url,

    // old IE stuff
    'progid': astNode('Raw'),
    'expression': expression
};
