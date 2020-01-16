const {
    WhiteSpace,
    Delim,
    Ident,
    Function: FunctionToken,
    Url,
    BadUrl,
    AtKeyword,
    Hash,
    Percentage,
    Dimension,
    Number: NumberToken,
    LeftParenthesis,
    CDC
} = require('../tokenizer/types');
const PLUSSIGN = 0x002B;    // U+002B PLUS SIGN (+)
const HYPHENMINUS = 0x002D; // U+002D HYPHEN-MINUS (-)

const code = (type, value) => {
    if (type === Delim) {
        type = value;
    }
    if (typeof type === 'string') {
        const charCode = type.charCodeAt(0);
        return charCode > 0x7F ? 0x8000 : charCode << 8;
    }

    return type;
};

// https://www.w3.org/TR/css-syntax-3/#serialization
// The only requirement for serialization is that it must "round-trip" with parsing,
// that is, parsing the stylesheet must produce the same data structures as parsing,
// serializing, and parsing again, except for consecutive <whitespace-token>s,
// which may be collapsed into a single token.

const isWhiteSpaceRequired = new Set([
    [Ident, [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension, CDC, LeftParenthesis]],
    [AtKeyword, [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension, CDC]],
    [Hash, [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension, CDC]],
    [Dimension, [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension, CDC]],
    ['#', [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension]],
    ['-', [Ident, FunctionToken, Url, BadUrl, '-', NumberToken, Percentage, Dimension]],
    [NumberToken, [Ident, FunctionToken, Url, BadUrl, NumberToken, Percentage, Dimension]],
    ['@', [Ident, FunctionToken, Url, BadUrl, '-']],
    ['.', [NumberToken, Percentage, Dimension]],
    ['+', [NumberToken, Percentage, Dimension]],
    ['/', ['*']]
].reduce(
    (result, [prev, next]) =>
        result.concat(next.map(next => (code(prev) << 16) | code(next))),
    []
));

module.exports = function(prevCode, type, value, curNode) {
    const nextCode = code(type, value);
    const nextCharCode = value.charCodeAt(0);
    let decision;

    if (nextCharCode === HYPHENMINUS) {
        decision = isWhiteSpaceRequired.has(prevCode << 16 | (HYPHENMINUS << 8));
    } else if (nextCharCode === PLUSSIGN) {
        decision = isWhiteSpaceRequired.has(prevCode << 16 | (PLUSSIGN << 8));
    } else {
        decision = isWhiteSpaceRequired.has(prevCode << 16 | nextCode);
    }

    if (decision) {
        this.emit(' ', WhiteSpace, curNode);
    }

    return nextCode;
};
