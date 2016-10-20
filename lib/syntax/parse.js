var SyntaxParseError = require('./error').SyntaxParseError;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;
var EXCLAMATIONMARK =    33;  // !
var NUMBERSIGN =         35;  // #
var PERCENTSIGN =        37;  // %
var AMPERSAND =          38;  // &
var APOSTROPHE =         39;  // '
var LEFTPARENTHESIS =    40;  // (
var RIGHTPARENTHESIS =   41;  // )
var ASTERISK =           42;  // *
var PLUSSIGN =           43;  // +
var COMMA =              44;  // ,
var SOLIDUS =            47;  // /
var LESSTHANSIGN =       60;  // <
var GREATERTHANSIGN =    62;  // >
var QUESTIONMARK =       63;  // ?
var LEFTSQUAREBRACKET =  91;  // [
var RIGHTSQUAREBRACKET = 93;  // ]
var LEFTCURLYBRACKET =  123;  // {
var VERTICALLINE =      124;  // |
var RIGHTCURLYBRACKET = 125;  // }
var COMBINATOR_PRECEDENCE = {
    ' ': 1,
    '&&': 2,
    '||': 3,
    '|': 4
};
var MULTIPLIER_DEFAULT = {
    comma: false,
    min: 1,
    max: 1,
    value: ''
};
var MULTIPLIER_ZERO_OR_MORE = {
    comma: false,
    min: 0,
    max: null,
    value: '*'
};
var MULTIPLIER_ONE_OR_MORE = {
    comma: false,
    min: 1,
    max: null,
    value: '+'
};
var MULTIPLIER_ONE_OR_MORE_COMMA_SEPARATED = {
    comma: true,
    min: 1,
    max: null,
    value: '#'
};
var MULTIPLIER_ZERO_OR_ONE = {
    comma: false,
    min: 0,
    max: 1,
    value: '?'
};
var NAME_CHAR = new Uint32Array(128);
NAME_CHAR.forEach(function(code, idx, array) {
    array[idx] = /[a-zA-Z0-9\-]/.test(String.fromCharCode(idx)) ? 1 : 0;
});

function charCodeAt(str, offset) {
    return offset < str.length ? str.charCodeAt(offset) : '';
}

function scanSpaces(str, start) {
    var end = start;

    for (; end < str.length; end++) {
        var code = str.charCodeAt(end);
        if (code !== R && code !== N && code !== F && code !== SPACE && code !== TAB) {
            break;
        }
    }

    return end !== start ? str.substring(start, end) : false;
}

function scanWord(str, start) {
    var end = start;

    for (; end < str.length; end++) {
        var code = str.charCodeAt(end);
        if (code >= 128 || NAME_CHAR[code] === 0) {
            break;
        }
    }

    if (start === end) {
        error(str, start, 'Expect a keyword');
    }

    return str.substring(start, end);
}

function scanString(str, start) {
    var end = str.indexOf('\'', start + 1);

    if (end === -1) {
        error(str, str.length, 'Expect a quote');
    }

    return str.substring(start, end + 1);
}

function scanNumber(str, start) {
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

function readMultiplierRange(str, start, comma) {
    var min = null;
    var max = null;
    var end = start + (comma ? 1 : 0);

    end += eat(str, end, LEFTCURLYBRACKET);

    min = scanNumber(str, end);
    end += min.length;

    if (charCodeAt(str, end) === COMMA) {
        end++;
        if (charCodeAt(str, end) !== RIGHTCURLYBRACKET) {
            max = scanNumber(str, end);
            end += max.length;
        }
    } else {
        max = min;
    }

    end += eat(str, end, RIGHTCURLYBRACKET);

    return {
        comma: comma,
        min: Number(min),
        max: max ? Number(max) : null,
        value: str.substring(start, end)
    };
}

global.x = 0;
function readMultiplier(str, pos) {
    switch (charCodeAt(str, pos)) {
        case ASTERISK:
            return MULTIPLIER_ZERO_OR_MORE;

        case PLUSSIGN:
            return MULTIPLIER_ONE_OR_MORE;

        case QUESTIONMARK:
            return MULTIPLIER_ZERO_OR_ONE;

        case NUMBERSIGN:
            return charCodeAt(str, pos + 1) === LEFTCURLYBRACKET
                ? readMultiplierRange(str, pos, true)
                : MULTIPLIER_ONE_OR_MORE_COMMA_SEPARATED;

        case LEFTCURLYBRACKET:
            return readMultiplierRange(str, pos, false);
    }

    return MULTIPLIER_DEFAULT;
}

function readProperty(str, start) {
    var end = start;
    var multiplier;
    var name;

    end += eat(str, end, LESSTHANSIGN);
    end += eat(str, end, APOSTROPHE);

    name = scanWord(str, end);
    end += name.length;

    end += eat(str, end, APOSTROPHE);
    end += eat(str, end, GREATERTHANSIGN);

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: 'Property',
        name: name,
        multiplier: multiplier,
        value: str.substring(start, end)
    };
}

function readType(str, start) {
    var end = start;
    var multiplier;
    var name;

    end += eat(str, end, LESSTHANSIGN);

    name = scanWord(str, end);
    end += name.length;

    if (charCodeAt(str, end) === LEFTPARENTHESIS && charCodeAt(str, end + 1) === RIGHTPARENTHESIS) {
        name += '()';
        end += 2;
    }

    end += eat(str, end, GREATERTHANSIGN);

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: 'Type',
        name: name,
        multiplier: multiplier,
        value: str.substring(start, end)
    };
}

function readKeywordOrFunction(str, start) {
    var end = start;
    var sequence = null;
    var multiplier;
    var name;

    name = scanWord(str, end);
    end += name.length;

    if (charCodeAt(str, end) === LEFTPARENTHESIS) {
        sequence = readSequence(str, end + 1);
        end += sequence.value.length + 1;

        end += eat(str, end, RIGHTPARENTHESIS);
    }

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    return {
        type: sequence ? 'Function' : 'Keyword',
        name: name,
        sequence: sequence,
        multiplier: multiplier,
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

    end += eat(str, end, LEFTSQUAREBRACKET);

    sequence = readSequence(str, end);
    end += sequence.value.length;

    end += eat(str, end, RIGHTSQUAREBRACKET);

    multiplier = readMultiplier(str, end);
    end += multiplier.value.length;

    if (charCodeAt(str, end) === EXCLAMATIONMARK) {
        end++;
        nonEmpty = true;
    }

    return {
        type: 'Group',
        terms: sequence.terms,
        combinator: sequence.combinator,
        nonEmpty: nonEmpty,
        multiplier: multiplier,
        value: str.substring(start, end)
    };
}

function peek(str, start) {
    var value;

    if (value = scanSpaces(str, start)) {
        return {
            type: 'Spaces',
            value: value
        };
    }

    var code = charCodeAt(str, start);
    var end = start + 1;

    if (code < 128 && NAME_CHAR[code] === 1) {
        return readKeywordOrFunction(str, start);
    }

    switch (code) {
        case LEFTSQUAREBRACKET:
            return readGroup(str, start);

        case LESSTHANSIGN:
            if (charCodeAt(str, end) === APOSTROPHE) {
                return readProperty(str, start);
            } else {
                return readType(str, start);
            }

        case VERTICALLINE:
            end += charCodeAt(str, end) === VERTICALLINE;
            return {
                type: 'Combinator',
                value: str.substring(start, end)
            };

        case AMPERSAND:
            eat(str, end, AMPERSAND);

            return {
                type: 'Combinator',
                value: '&&'
            };

        case COMMA:
            return {
                type: 'Comma',
                value: ','
            };

        case SOLIDUS:
            return {
                type: 'Slash',
                value: '/'
            };

        case PERCENTSIGN:  // looks like exception, needs for attr()'s <type-or-unit>
            return {
                type: 'Percent',
                value: '%'
            };

        case LEFTPARENTHESIS:
            var sequence = readSequence(str, end);
            end += sequence.value.length;
            end += eat(str, end, RIGHTPARENTHESIS);

            return {
                type: 'Parentheses',
                sequence: sequence,
                value: str.substring(start, end)
            };

        case APOSTROPHE:
            return {
                type: 'String',
                value: scanString(str, start)
            };
    }
}

function eat(str, pos, code) {
    if (charCodeAt(str, pos) !== code) {
        error(str, pos, 'Expect `' + String.fromCharCode(code) + '`');
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
