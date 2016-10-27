var SyntaxParseError = require('./error').SyntaxParseError;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;
var EXCLAMATIONMARK = 33;    // !
var NUMBERSIGN = 35;         // #
var PERCENTSIGN = 37;        // %
var AMPERSAND = 38;          // &
var APOSTROPHE = 39;         // '
var LEFTPARENTHESIS = 40;    // (
var RIGHTPARENTHESIS = 41;   // )
var ASTERISK = 42;           // *
var PLUSSIGN = 43;           // +
var COMMA = 44;              // ,
var SOLIDUS = 47;            // /
var LESSTHANSIGN = 60;       // <
var GREATERTHANSIGN = 62;    // >
var QUESTIONMARK = 63;       // ?
var LEFTSQUAREBRACKET = 91;  // [
var RIGHTSQUAREBRACKET = 93; // ]
var LEFTCURLYBRACKET = 123;  // {
var VERTICALLINE = 124;      // |
var RIGHTCURLYBRACKET = 125; // }
var COMBINATOR_PRECEDENCE = {
    ' ': 1,
    '&&': 2,
    '||': 3,
    '|': 4
};
var MULTIPLIER_DEFAULT = {
    comma: false,
    min: 1,
    max: 1
};
var MULTIPLIER_ZERO_OR_MORE = {
    comma: false,
    min: 0,
    max: 0
};
var MULTIPLIER_ONE_OR_MORE = {
    comma: false,
    min: 1,
    max: 0
};
var MULTIPLIER_ONE_OR_MORE_COMMA_SEPARATED = {
    comma: true,
    min: 1,
    max: 0
};
var MULTIPLIER_ZERO_OR_ONE = {
    comma: false,
    min: 0,
    max: 1
};
var NAME_CHAR = (function() {
    var array = typeof Uint32Array === 'function' ? new Uint32Array(128) : new Array(128);
    for (var i = 0; i < 128; i++) {
        array[i] = /[a-zA-Z0-9\-]/.test(String.fromCharCode(i)) ? 1 : 0;
    };
    return array;
})();

var Scanner = function(str) {
    this.str = str;
    this.pos = 0;
};
Scanner.prototype = {
    charCode: function() {
        return this.pos < this.str.length ? this.str.charCodeAt(this.pos) : 0;
    },
    nextCharCode: function() {
        return this.pos + 1 < this.str.length ? this.str.charCodeAt(this.pos + 1) : 0;
    },

    substringToPos: function(end) {
        return this.str.substring(this.pos, this.pos = end);
    },
    eat: function(code) {
        if (this.charCode() !== code) {
            error(this, this.pos, 'Expect `' + String.fromCharCode(code) + '`');
        }

        this.pos++;
    }
};

function scanSpaces(scanner) {
    var end = scanner.pos + 1;

    for (; end < scanner.str.length; end++) {
        var code = scanner.str.charCodeAt(end);
        if (code !== R && code !== N && code !== F && code !== SPACE && code !== TAB) {
            break;
        }
    }

    return scanner.substringToPos(end);
}

function scanWord(scanner) {
    var end = scanner.pos;

    for (; end < scanner.str.length; end++) {
        var code = scanner.str.charCodeAt(end);
        if (code >= 128 || NAME_CHAR[code] === 0) {
            break;
        }
    }

    if (scanner.pos === end) {
        error(scanner, scanner.pos, 'Expect a keyword');
    }

    return scanner.substringToPos(end);
}

function scanNumber(scanner) {
    var end = scanner.pos;

    for (; end < scanner.str.length; end++) {
        var code = scanner.str.charCodeAt(end);
        if (code < 48 || code > 57) {
            break;
        }
    }

    if (scanner.pos === end) {
        error(scanner, scanner.pos, 'Expect a number');
    }

    return scanner.substringToPos(end);
}

function scanString(scanner) {
    var end = scanner.str.indexOf('\'', scanner.pos + 1);

    if (end === -1) {
        error(scanner, scanner.str.length, 'Expect a quote');
    }

    return scanner.substringToPos(end + 1);
}

function readMultiplierRange(scanner, comma) {
    var min = null;
    var max = null;

    scanner.eat(LEFTCURLYBRACKET);

    min = scanNumber(scanner);

    if (scanner.charCode() === COMMA) {
        scanner.pos++;
        if (scanner.charCode() !== RIGHTCURLYBRACKET) {
            max = scanNumber(scanner);
        }
    } else {
        max = min;
    }

    scanner.eat(RIGHTCURLYBRACKET);

    return {
        comma: comma,
        min: Number(min),
        max: max ? Number(max) : 0
    };
}

function readMultiplier(scanner) {
    switch (scanner.charCode()) {
        case ASTERISK:
            scanner.pos++;
            return MULTIPLIER_ZERO_OR_MORE;

        case PLUSSIGN:
            scanner.pos++;
            return MULTIPLIER_ONE_OR_MORE;

        case QUESTIONMARK:
            scanner.pos++;
            return MULTIPLIER_ZERO_OR_ONE;

        case NUMBERSIGN:
            scanner.pos++;

            if (scanner.charCode() !== LEFTCURLYBRACKET) {
                return MULTIPLIER_ONE_OR_MORE_COMMA_SEPARATED;
            }

            return readMultiplierRange(scanner, true);

        case LEFTCURLYBRACKET:
            return readMultiplierRange(scanner, false);
    }

    return MULTIPLIER_DEFAULT;
}

function readProperty(scanner) {
    var name;

    scanner.eat(LESSTHANSIGN);
    scanner.eat(APOSTROPHE);

    name = scanWord(scanner);

    scanner.eat(APOSTROPHE);
    scanner.eat(GREATERTHANSIGN);

    return {
        type: 'Property',
        name: name,
        multiplier: readMultiplier(scanner)
    };
}

function readType(scanner) {
    var name;

    scanner.eat(LESSTHANSIGN);
    name = scanWord(scanner);

    if (scanner.charCode() === LEFTPARENTHESIS &&
        scanner.nextCharCode() === RIGHTPARENTHESIS) {
        scanner.pos += 2;
        name += '()';
    }

    scanner.eat(GREATERTHANSIGN);

    return {
        type: 'Type',
        name: name,
        multiplier: readMultiplier(scanner)
    };
}

function readKeywordOrFunction(scanner) {
    var sequence = null;
    var name;

    name = scanWord(scanner);

    if (scanner.charCode() === LEFTPARENTHESIS) {
        scanner.pos++;
        sequence = readSequence(scanner);
        scanner.eat(RIGHTPARENTHESIS);

        return {
            type: 'Function',
            name: name,
            sequence: sequence,
            multiplier: readMultiplier(scanner)
        };
    }

    return {
        type: 'Keyword',
        name: name,
        multiplier: readMultiplier(scanner)
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

function readSequence(scanner) {
    var terms = [];
    var combinators = {};
    var token;
    var prevToken = null;
    var prevTokenPos = scanner.pos;

    while (token = peek(scanner)) {
        if (token.type !== 'Spaces') {
            if (token.type === 'Combinator') {
                // check for combinator in group beginning and double combinator sequence
                if (prevToken === null || prevToken.type === 'Combinator') {
                    error(scanner, prevTokenPos, 'Unexpected combinator');
                }

                combinators[token.value] = true;
            } else if (prevToken !== null && prevToken.type !== 'Combinator') {
                combinators[' '] = true;  // a b
                terms.push({
                    type: 'Combinator',
                    value: ' '
                });
            }

            terms.push(token);
            prevToken = token;
            prevTokenPos = scanner.pos;
        }
    }

    // check for combinator in group ending
    if (prevToken !== null && prevToken.type === 'Combinator') {
        error(scanner, scanner.pos - prevTokenPos, 'Unexpected combinator');
    }

    return {
        type: 'Sequence',
        terms: terms,
        combinator: regroupTerms(terms, combinators) || ' '
    };
}

function readGroup(scanner) {
    var sequence;
    var nonEmpty = false;
    var multiplier;

    scanner.eat(LEFTSQUAREBRACKET);
    sequence = readSequence(scanner);

    scanner.eat(RIGHTSQUAREBRACKET);
    multiplier = readMultiplier(scanner);

    if (scanner.charCode() === EXCLAMATIONMARK) {
        scanner.pos++;
        nonEmpty = true;
    }

    return {
        type: 'Group',
        terms: sequence.terms,
        combinator: sequence.combinator,
        nonEmpty: nonEmpty,
        multiplier: multiplier
    };
}

function peek(scanner) {
    var code = scanner.charCode();

    if (code < 128 && NAME_CHAR[code] === 1) {
        return readKeywordOrFunction(scanner);
    }

    switch (code) {
        case LEFTSQUAREBRACKET:
            return readGroup(scanner);

        case LESSTHANSIGN:
            if (scanner.nextCharCode() === APOSTROPHE) {
                return readProperty(scanner);
            } else {
                return readType(scanner);
            }

        case VERTICALLINE:
            return {
                type: 'Combinator',
                value: scanner.substringToPos(scanner.nextCharCode() === VERTICALLINE ? scanner.pos + 2 : scanner.pos + 1)
            };

        case AMPERSAND:
            scanner.pos++;
            scanner.eat(AMPERSAND);
            return {
                type: 'Combinator',
                value: '&&'
            };

        case COMMA:
            scanner.pos++;
            return {
                type: 'Comma',
                value: ','
            };

        case SOLIDUS:
            scanner.pos++;
            return {
                type: 'Slash',
                value: '/'
            };

        case PERCENTSIGN:  // looks like exception, needs for attr()'s <type-or-unit>
            scanner.pos++;
            return {
                type: 'Percent',
                value: '%'
            };

        case LEFTPARENTHESIS:
            scanner.pos++;
            var sequence = readSequence(scanner);
            scanner.eat(RIGHTPARENTHESIS);

            return {
                type: 'Parentheses',
                sequence: sequence
            };

        case APOSTROPHE:
            return {
                type: 'String',
                value: scanString(scanner)
            };

        case SPACE:
        case TAB:
        case N:
        case R:
        case F:
            return {
                type: 'Spaces',
                value: scanSpaces(scanner)
            };
    }
}

function error(scanner, pos, msg) {
    throw new SyntaxParseError(msg || 'Unexpected input', scanner.str, pos);
}

function parse(str) {
    var scanner = new Scanner(str);
    var result = readSequence(scanner);

    if (scanner.pos !== str.length) {
        error(scanner, scanner.pos);
    }

    // reduce redundant sequences with single term
    // if (result.terms.length === 1) {
    //     result = result.terms[0];
    // }

    return result;
}

// warm up parse to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
parse('[a&&<b>#|<\'c\'>*||e(){2,} f{2} /,(% g#{1,2})]!');

module.exports = parse;
