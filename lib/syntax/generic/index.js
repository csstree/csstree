var LENGTH = {
    // absolute length units
    'px': true,
    'mm': true,
    'cm': true,
    'in': true,
    'pt': true,
    'pc': true,

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
    hz: true,
    khz: true
};

// https://www.w3.org/TR/css3-images/#resolution-type
var RESOLUTION = {
    dpi: true,
    dpcm: true,
    dppx: true
};

// https://drafts.csswg.org/css-grid/#fr-unit
var FLEX = {
    fr: true
};

// can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
// https://drafts.csswg.org/css-values/#calc-notation
function isCalc(node) {
    return node.data.type === 'Function' && node.data.name === 'calc';
}

function dimension(type) {
    return function(node) {
        if (node && (isCalc(node) || (node.data.type === 'Dimension' && type.hasOwnProperty(node.data.unit.toLowerCase())))) {
            return {
                next: node.next,
                match: [node.data]
            };
        }
    };
}

function length(node) {
    if (node && (
            isCalc(node)
            ||
            (node.data.type === 'Dimension' && LENGTH.hasOwnProperty(node.data.unit.toLowerCase()))
            ||
            (node.data.type === 'Number' && Number(node.data.value) === 0)
        )
    ) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function attr(node) {
    if (node && node.data.type === 'Function' && node.data.name === 'attr') {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function astNode(type) {
    return function(node) {
        if (node && node.data.type === type) {
            return {
                next: node.next,
                match: [node.data]
            };
        }
    };
}

function number(node) {
    if (node && (isCalc(node) || node.data.type === 'Number')) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function numberZeroOne(node) {
    if (node && (isCalc(node) || node.data.type === 'Number')) {
        var value = Number(node.data.value);
        if (value >= 0 && value <= 1) {
            return {
                next: node.next,
                match: [node.data]
            };
        }
    }
}

function integer(node) {
    if (node && (isCalc(node) || (node.data.type === 'Number' && node.data.value.indexOf('.') === -1))) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function positiveInteger(node) {
    if (node && (isCalc(node) || (node.data.type === 'Number' && node.data.value.indexOf('.') === -1 && node.data.value.charAt(0) !== '-'))) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function percentage(node) {
    if (node && (isCalc(node) || node.data.type === 'Percentage')) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function hexColor(node) {
    if (!node || node.data.type !== 'Hash') {
        return;
    }

    var hex = node.data.value;
    if (/^[0-9a-fA-F]{3,8}$/.test(hex) &&
        (hex.length === 3 || hex.length === 4 || hex.length === 6 || hex.length === 8)) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function idSelector(node) {
    if (!node || node.data.type !== 'Hash') {
        return;
    }

    var cursor = node.next;
    var match = [node.data];
    while (cursor && (cursor.data.type === 'Number' || cursor.data.type === 'Identifier')) {
        match.push(cursor.data);
        cursor = cursor.next;
    }

    return {
        next: cursor,
        match: match
    };
}

function expression(node) {
    if (node && node.data.type === 'Function' && node.data.name.toLowerCase() === 'expression') {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function unicodeRange(node) {
    // TODO: change type check when it will be changed to UnicodeRange
    if (node && node.data.type === 'Identifier' && /u+/i.test(node.data.name)) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

module.exports = {
    'angle': dimension(ANGLE),
    'attr()': attr,
    'custom-ident': astNode('Identifier'),
    'dimension': astNode('Dimension'),
    'frequency': dimension(FREQUENCY),
    'flex': dimension(FLEX),
    'hex-color': hexColor,
    'id-selector': idSelector, // element( <id-selector> )
    'ident': astNode('Identifier'),
    'integer': integer,
    'length': length,
    'number': number,
    'number-zero-one': numberZeroOne,
    'percentage': percentage,
    'positive-integer': positiveInteger,
    'resolution': dimension(RESOLUTION),
    'string': astNode('String'),
    'time': dimension(TIME),
    'unicode-range': unicodeRange,
    'url': astNode('Url'),

    // old IE stuff
    'progid': astNode('Progid'),
    'expression': expression
};
