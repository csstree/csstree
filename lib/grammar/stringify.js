function isTokenType(token/*, type, type*/) {
    if (token) {
        for (var i = 1; i < arguments.length; i++) {
            if (token.type === arguments[i]) {
                return true;
            }
        }
    }

    return false;
}

function serializeMultiplier(token) {
    if (token.min === 0 && token.max === 1) {
        return '?';
    }

    if (token.min === 1 && token.max === 1) {
        return '';
    }

    if (token.min === 0 && token.max === Infinity) {
        return '*';
    }

    if (token.min === 1 && token.max === Infinity) {
        return token.comma ? '#' : '+';
    }

    return (
        (token.comma ? '#' : '') +
        '{' + token.min + (token.min !== token.max ? ',' + (token.max !== Infinity ? token.max : '') : '') + '}'
    );
}

function stringifySequence(token, implicitBraces) {
    var result = '';

    if (token.type === 'Group' || implicitBraces) {
        result += '[' + (!isTokenType(token.terms[0], 'Comma') ? ' ' : '');
    }

    result += token.terms.map(function(term) {
        return stringify(term, implicitBraces);
    }).join(token.combinator === ' ' ? ' ' : ' ' + token.combinator + ' ');

    if (token.type === 'Group' || implicitBraces) {
        result += ' ]';
    }

    return result;
}

function stringifyParentheses(sequence, implicitBraces) {
    if (!sequence.terms.length) {
        return '()';
    }

    return '( ' + stringifySequence(sequence, implicitBraces) + ' )';
}

function stringify(token, implicitBraces) {
    if (Array.isArray(token)) {
        return token.map(function(item) {
            return stringify(item, implicitBraces);
        }).join('');
    }

    switch (token.type) {
        case 'Sequence':
            return stringifySequence(token, implicitBraces);

        case 'Group':
            return (
                stringifySequence(token, implicitBraces) +
                (token.allowEmpty ? '' : '!') +
                serializeMultiplier(token)
            );

        case 'Keyword':
            return token.name + serializeMultiplier(token);

        case 'Function':
            return token.name + stringifyParentheses(token.sequence, implicitBraces) + serializeMultiplier(token);

        case 'Parentheses':
            return stringifyParentheses(token.sequence, implicitBraces);

        case 'Type':
            return '<' + token.name + '>' + serializeMultiplier(token);

        case 'Property':
            return '<\'' + token.name + '\'>' + serializeMultiplier(token);

        case 'Combinator':
        case 'Comma':
        case 'Slash':
        case 'String':
        case 'Percent':
            return token.value;

        default:
            throw new Error('Unknown type: ' + token.type);
    }
}

module.exports = stringify;
