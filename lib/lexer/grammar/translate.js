'use strict';

function isNodeType(node, type) {
    return node && node.type === type;
}

function serializeMultiplier(multiplier) {
    if (multiplier.min === 0 && multiplier.max === 1) {
        return '?';
    }

    if (multiplier.min === 1 && multiplier.max === 1) {
        return '';
    }

    if (multiplier.min === 0 && multiplier.max === 0) {
        return '*';
    }

    if (multiplier.min === 1 && multiplier.max === 0) {
        return multiplier.comma ? '#' : '+';
    }

    return (
        (multiplier.comma ? '#' : '') +
        '{' + multiplier.min + (multiplier.min !== multiplier.max ? ',' + (multiplier.max !== 0 ? multiplier.max : '') : '') + '}'
    );
}

function translateSequence(node, forceBraces) {
    var result = '';

    if (node.explicit || forceBraces) {
        result += '[' + (!isNodeType(node.terms[0], 'Comma') ? ' ' : '');
    }

    result += node.terms.map(function(term) {
        return translate(term, forceBraces);
    }).join(node.combinator === ' ' ? ' ' : ' ' + node.combinator + ' ');

    if (node.explicit || forceBraces) {
        result += ' ]';
    }

    return result;
}

function translateParentheses(sequence, forceBraces) {
    if (!sequence.terms.length) {
        return '()';
    }

    return '( ' + translateSequence(sequence, forceBraces) + ' )';
}

function translate(node, forceBraces) {
    if (Array.isArray(node)) {
        return node.map(function(item) {
            return translate(item, forceBraces);
        }).join('');
    }

    switch (node.type) {
        case 'Group':
            return (
                translateSequence(node, forceBraces) +
                (node.disallowEmpty ? '!' : '') +
                serializeMultiplier(node.multiplier)
            );

        case 'Keyword':
            return node.name;

        case 'Function':
            return node.name + translateParentheses(node.sequence, forceBraces);

        case 'Parentheses': // replace for seq('(' seq(...node.sequence) ')')
            return translateParentheses(node.sequence, forceBraces);

        case 'Type':
            return '<' + node.name + '>';

        case 'Property':
            return '<\'' + node.name + '\'>';

        case 'Combinator': // remove?
        case 'Slash':      // replace for String? '/'
        case 'Percent':    // replace for String? '%'
        case 'String':
        case 'Comma':
            return node.value;

        default:
            throw new Error('Unknown node type: ' + node.type);
    }
}

module.exports = translate;
