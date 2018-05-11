'use strict';

function isNodeType(node, type) {
    return node && node.type === type;
}

function serializeMultiplier(multiplier) {
    if (multiplier.min === 0 && multiplier.max === 0) {
        return '*';
    }

    if (multiplier.min === 0 && multiplier.max === 1) {
        return '?';
    }

    if (multiplier.min === 1 && multiplier.max === 0) {
        return multiplier.comma ? '#' : '+';
    }

    if (multiplier.min === 1 && multiplier.max === 1) {
        return '';
    }

    return (
        (multiplier.comma ? '#' : '') +
        '{' + multiplier.min + (multiplier.min !== multiplier.max ? ',' + (multiplier.max !== 0 ? multiplier.max : '') : '') + '}'
    );
}

function generateSequence(node, forceBraces, decorate) {
    var result = '';

    if (node.explicit || forceBraces) {
        result += '[' + (!isNodeType(node.terms[0], 'Comma') ? ' ' : '');
    }

    result += node.terms.map(function(term) {
        return generate(term, forceBraces, decorate);
    }).join(node.combinator === ' ' ? ' ' : ' ' + node.combinator + ' ');

    if (node.explicit || forceBraces) {
        result += ' ]';
    }

    return result;
}

function generate(node, forceBraces, decorate) {
    var result;

    switch (node.type) {
        case 'Group':
            result =
                generateSequence(node, forceBraces, decorate) +
                (node.disallowEmpty ? '!' : '');
            break;

        case 'Multiplier':
            result =
                generate(node.term, forceBraces, decorate) +
                serializeMultiplier(node);
            break;

        case 'Type':
            result = '<' + node.name + '>';
            break;

        case 'Property':
            result = '<\'' + node.name + '\'>';
            break;

        case 'Keyword':
            result = node.name;
            break;

        case 'Function':
            result = node.name + '(';
            break;

        case 'String':
        case 'Token':
            result = node.value;
            break;

        case 'Comma':
            result = ',';
            break;

        default:
            throw new Error('Unknown node type `' + node.type + '`');
    }

    if (typeof decorate === 'function') {
        result = decorate(result, node);
    }

    return result;
}

module.exports = generate;
