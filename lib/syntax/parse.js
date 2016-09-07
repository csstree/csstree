var COMBINATOR_PRECEDENCE = {
    ' ': 1,
    '&&': 2,
    '||': 3,
    '|': 4
};

var spaces = /[ \r\n\f]/;
var nameChar = /[a-zA-Z0-9\-]/;
var number = /\d/;

function readWord(str, start) {
    var end = start;

    while (nameChar.test(str.charAt(end))) {
        end++;
    }

    return str.substring(start, end);
}

function readNumber(str, start) {
    var end = start;

    while (number.test(str.charAt(end))) {
        end++;
    }

    return str.substring(start, end);
}

function readString(str, start) {
    var end = start + 1;

    while (str.charAt(end) !== '\'') {
        end++;
    }

    end += eat(str, end, '\'');

    return str.substring(start, end);
}

function readMultiplier(str, pos) {
    function readRange() {
        var min = null;
        var max = null;

        pos += eat(str, pos, '{');

        min = readNumber(str, pos) || error(str, pos);
        pos += min.length;

        if (str.charAt(pos) === ',') {
            pos++;
            if (str.charAt(pos) !== '}') {
                max = readNumber(str, pos) || error(str, pos);
                pos += max.length;
            }
        } else {
            max = min;
        }

        pos += eat(str, pos, '}');

        return {
            min: Number(min),
            max: max ? Number(max) : null
        };
    }

    switch (str.charAt(pos)) {
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

            if (str.charAt(pos) === '{') {
                var range = readRange();
                if (range) {
                    return {
                        comma: true,
                        min: range.min,
                        max: range.max,
                        value: str.substring(start, pos)
                    };
                }
            }

            return {
                comma: true,
                min: 1,
                max: null,
                value: '#'
            };

        case '{':
            var start = pos;
            var range = readRange();

            if (range) {
                return {
                    comma: false,
                    min: range.min,
                    max: range.max,
                    value: str.substring(start, pos)
                };
            }
            break;
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

    name = readWord(str, end) || error(str, end);
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

    name = readWord(str, end) || error(str, end);
    end += name.length;

    if (str.charAt(end) === '(' && str.charAt(end + 1) === ')') {
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

    name = readWord(str, end) || error(str, end);
    end += name.length;

    if (str.charAt(end) === '(') {
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
                    error(str, end);
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
        error(str, end - lastToken.value.length);
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

    if (str.charAt(end) === '!') {
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
    while (spaces.test(str.charAt(end))) {
        end++;
    }
    return {
        type: 'Spaces',
        value: str.substring(start, end)
    };
}

function peek(str, start) {
    var c = str.charAt(start);
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
            if (str.charAt(start + 1) === '\'') {
                return readProperty(str, start);
            } else {
                return readType(str, start);
            }

        case '|':
            end += str.charAt(end) === '|';
            return {
                type: 'Combinator',
                value: str.substring(start, end)
            };

        case '&':
            if (str.charAt(end) === '&') {
                return {
                    type: 'Combinator',
                    value: '&&'
                };
            }
            break;

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
    if (str.charAt(pos) !== ch) {
        error(str, pos, 'Expect `' + ch + '`');
    }

    return 1;
}

function error(str, pos, msg) {
    throw new Error(
        (msg || 'Unexpected input') + ':\n' +
        '  ' + str + '\n' +
        '--' + new Array(pos + 1).join('-') + '^'
    );
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
