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

function notImplemented(name) {
    return function() {
        throw new Error('Generic `' + name + '` type is not implemented yet');
    };
}

function dimension(type) {
    return function(node) {
        if (node && node.data.type === 'Dimension' && type.hasOwnProperty(node.data.unit.toLowerCase())) {
            return {
                next: node.next,
                match: [node.data]
            };
        }
    };
}

function length(node) {
    if (node && (
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

function integer(node) {
    if (node && node.data.type === 'Number' && node.data.value.indexOf('.') === -1) {
        return {
            next: node.next,
            match: [node.data]
        };
    }
}

function positiveInteger(node) {
    if (node && node.data.type === 'Number' && node.data.value.indexOf('.') === -1 && node.data.value.charAt(0) !== '-') {
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

module.exports = {
    'angle': dimension(ANGLE),

    'attr-name': notImplemented('attr-name'),
    'attr-fallback': notImplemented('attr-fallback'),

    'custom-ident': astNode('Identifier'),
    'dimension': astNode('Dimension'),
    'frequency': dimension(FREQUENCY),
    'flex': dimension(FLEX),
    'hex-color': hexColor,
    'id-selector': idSelector, // element( <id-selector> )
    'ident': astNode('Identifier'),
    'integer': integer,
    'length': length,
    'number': astNode('Number'),
    'percentage': astNode('Percentage'),
    'positive-integer': positiveInteger,
    'resolution': dimension(RESOLUTION),
    'string': astNode('String'),
    'time': dimension(TIME),
    'url': astNode('Url')
};
