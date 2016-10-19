var SyntaxParseError = require('./error').SyntaxParseError;
var COMBINATOR_PRECEDENCE = {
    ' ': 1,
    '&&': 2,
    '||': 3,
    '|': 4
};

var spaces = /[ \r\n\f]/;
var nameChar = /[a-zA-Z0-9\-]/;

function charAt(str, offset) {
    return offset < str.length ? str.charAt(offset) : '';
}

function readWord(str, start) {
    var end = start;

    while (nameChar.test(charAt(str, end))) {
        end++;
    }

    if (start === end) {
        error(str, start, 'Expect a keyword');
    }

    return str.substring(start, end);
}

function readString(str, start) {
    var end = str.indexOf('\'', start + 1);

    if (end === -1) {
        error(str, str.length, 'Expect a quote');
    }

    return str.substring(start, end + 1);
}

function readNumber(str, start) {
    var end = start;

    for (; end < str.length; end++) {
        var code = str.charCodeAt(end);
        if (code < 48 || code > 57) {
            break;
        }
    }

    if (start === end) {
        error(str, start, 'Expect a number');
    }

    return str.substring(start, end);
}

function readMultiplierRange(str, pos) {
    var min = null;
    var max = null;

    pos += eat(str, pos, '{');

    min = readNumber(str, pos);
    pos += min.length;

    if (charAt(str, pos) === ',') {
        pos++;
        if (charAt(str, pos) !== '}') {
            max = readNumber(str, pos);
            pos += max.length;
        }
    } else {
        max = min;
    }

    pos += eat(str, pos, '}');

    return {
        pos: pos,
        min: Number(min),
        max: max ? Number(max) : null
    };
}

function readMultiplier(str, pos) {
    switch (charAt(str, pos)) {
        case '*':
            return {
                comma: false,
                min: 0,
                max: null,
                value: '*'
            };

        case '+':
            return {
                comma: false,
                min: 1,
                max: null,
                value: '+'
            };

        case '?':
            return {
                comma: false,
                min: 0,
                max: 1,
                value: '?'
            };

        case '#':
            var start = pos;

            pos++; // #

            if (charAt(str, pos) === '{') {
                var range = readMultiplierRange(str, pos);
                return {
                    comma: true,
                    min: range.min,
                    max: range.max,
                    value: str.substring(start, range.pos)
                };
            }

            return {
                comma: true,
                min: 1,
                max: null,
                value: '#'
            };

        case '{':
            var start = pos;
            var range = readMultiplierRange(str, pos);

            return {
                comma: false,
                min: range.min,
                max: range.max,
                value: str.substring(start, range.pos)
            };
    }

    return {
        comma: false,
        min: 1,
        max: 1,
        value: ''
    };
}

function readProperty(str, start) {
    var end = start;
    var multiplier;
    var name;

    end += eat(str, end, '<');
    end += eat(str, end, '\'');

    name = readWord(str, end);
    end += name.length;

    end += eat(str, end, '\'');
    end += eat(str, end, '>');

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: 'Property',
        name: name,
        comma: multiplier.comma,
        min: multiplier.min,
        max: multiplier.max,
        value: str.substring(start, end)
    };
}

function readType(str, start) {
    var end = start;
    var multiplier;
    var name;

    end += eat(str, end, '<');

    name = readWord(str, end);
    end += name.length;

    if (charAt(str, end) === '(' && charAt(str, end + 1) === ')') {
        name += '()';
        end += 2;
    }

    end += eat(str, end, '>');

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: 'Type',
        name: name,
        comma: multiplier.comma,
        min: multiplier.min,
        max: multiplier.max,
        value: str.substring(start, end)
    };
}

function readKeywordOrFunction(str, start) {
    var end = start;
    var sequence = null;
    var multiplier;
    var name;

    name = readWord(str, end);
    end += name.length;

    if (charAt(str, end) === '(') {
        sequence = readSequence(str, end + 1);
        end += sequence.value.length + 1;

        end += eat(str, end, ')');
    }

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: sequence ? 'Function' : 'Keyword',
        name: name,
        sequence: sequence,
        comma: multiplier.comma,
        min: multiplier.min,
        max: multiplier.max,
        value: str.substring(start, end)
    };
}

function regroupTerms(terms, combinators) {
    function createGroup(terms, combinator) {
        return {
            type: 'Sequence',
            terms: terms,
            combinator: combinator
        };
    }

    combinators = Object.keys(combinators).sort(function(a, b) {
        return COMBINATOR_PRECEDENCE[a] - COMBINATOR_PRECEDENCE[b];
    });

    while (combinators.length > 0) {
        var combinator = combinators.shift();
        for (var i = 0, subgroupStart = 0; i < terms.length; i++) {
            var term = terms[i];
            if (term.type === 'Combinator') {
                if (term.value === combinator) {
                    if (subgroupStart === -1) {
                        subgroupStart = i - 1;
                    }
                    terms.splice(i, 1);
                    i--;
                } else {
                    if (subgroupStart !== -1 && i - subgroupStart > 1) {
                        terms.splice(
                            subgroupStart,
                            i - subgroupStart,
                            createGroup(terms.slice(subgroupStart, i), combinator)
                        );
                        i = subgroupStart + 1;
                    }
                    subgroupStart = -1;
                }
            }
        }

        if (subgroupStart !== -1 && combinators.length) {
            terms.splice(
                subgroupStart,
                i - subgroupStart,
                createGroup(terms.slice(subgroupStart, i), combinator)
            );
        }
    }

    return combinator;
}

function readSequence(str, start) {
    var terms = [];
    var combinators = {};
    var end = start;
    var token;
    var lastToken;

    while (token = peek(str, end)) {
        if (token.type !== 'Spaces') {
            if (token.type === 'Combinator') {
                // check for combinator in group beginning and double combinator sequence
                if (!lastToken || lastToken.type === 'Combinator') {
                    error(str, end, 'Unexpected combinator');
                }

                combinators[token.value] = true;
            } else if (lastToken && lastToken.type !== 'Combinator') {
                combinators[' '] = true;  // a b
                terms.push({
                    type: 'Combinator',
                    value: ' '
                });
            }

            terms.push(token);
            lastToken = token;
        }

        end += token.value.length;
    }

    // check for combinator in group ending
    if (lastToken && lastToken.type === 'Combinator') {
        error(str, end - lastToken.value.length, 'Unexpected combinator');
    }

    return {
        type: 'Sequence',
        terms: terms,
        combinator: regroupTerms(terms, combinators) || ' ',
        value: str.substring(start, end)
    };
}

function readGroup(str, start) {
    var sequence;
    var nonEmpty = false;
    var multiplier;
    var end = start;

    end += eat(str, end, '[');

    sequence = readSequence(str, end);
    end += sequence.value.length;

    end += eat(str, end, ']');

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    if (charAt(str, end) === '!') {
        end++;
        nonEmpty = true;
    }

    return {
        type: 'Group',
        terms: sequence.terms,
        combinator: sequence.combinator,
        nonEmpty: nonEmpty,
        comma: multiplier.comma,
        min: multiplier.min,
        max: multiplier.max,
        value: str.substring(start, end)
    };
}

function readSpaces(str, start) {
    var end = start + 1;

    while (spaces.test(charAt(str, end))) {
        end++;
    }

    return {
        type: 'Spaces',
        value: str.substring(start, end)
    };
}

function peek(str, start) {
    var c = charAt(str, start);
    var end = start + 1;

    if (spaces.test(c)) {
        return readSpaces(str, start);
    }

    if (nameChar.test(c)) {
        return readKeywordOrFunction(str, start);
    }

    switch (c) {
        case '[':
            return readGroup(str, start);

        case '<':
            if (charAt(str, end) === '\'') {
                return readProperty(str, start);
            } else {
                return readType(str, start);
            }

        case '|':
            end += charAt(str, end) === '|';
            return {
                type: 'Combinator',
                value: str.substring(start, end)
            };

        case '&':
            eat(str, end, '&');

            return {
                type: 'Combinator',
                value: '&&'
            };

        case ',':
            return {
                type: 'Comma',
                value: ','
            };

        case '/':
            return {
                type: 'Slash',
                value: '/'
            };

        case '%':  // looks like exception, needs for attr()'s <type-or-unit>
            return {
                type: 'Percent',
                value: '%'
            };

        case '(':
            var sequence = readSequence(str, end);
            end += sequence.value.length;
            end += eat(str, end, ')');

            return {
                type: 'Parentheses',
                sequence: sequence,
                value: str.substring(start, end)
            };

        case '\'':
            return {
                type: 'String',
                value: readString(str, start)
            };
    }
}

function eat(str, pos, ch) {
    if (charAt(str, pos) !== ch) {
        error(str, pos, 'Expect `' + ch + '`');
    }

    return 1;
}

function error(str, pos, msg) {
    throw new SyntaxParseError(msg || 'Unexpected input', str, pos);
}

module.exports = function parse(str) {
    var result = readSequence(str, 0);

    if (result.value !== str) {
        error(str, result.value.length);
    }

    // reduce redundant sequences with single term
    // if (result.terms.length === 1) {
    //     result = result.terms[0];
    // }

    return result;
};
