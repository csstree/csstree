import {
    WhiteSpace,
    Delim,
    Ident,
    Function as FunctionToken,
    Url,
    BadUrl,
    AtKeyword,
    Hash,
    Percentage,
    Dimension,
    Number as NumberToken,
    String as StringToken,
    Colon,
    LeftParenthesis,
    RightParenthesis,
    CDC
} from '../tokenizer/index.js';

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

const specPairs = [
    [Ident, Ident],
    [Ident, FunctionToken],
    [Ident, Url],
    [Ident, BadUrl],
    [Ident, '-'],
    [Ident, NumberToken],
    [Ident, Percentage],
    [Ident, Dimension],
    [Ident, CDC],
    [Ident, LeftParenthesis],

    [AtKeyword, Ident],
    [AtKeyword, FunctionToken],
    [AtKeyword, Url],
    [AtKeyword, BadUrl],
    [AtKeyword, '-'],
    [AtKeyword, NumberToken],
    [AtKeyword, Percentage],
    [AtKeyword, Dimension],
    [AtKeyword, CDC],

    [Hash, Ident],
    [Hash, FunctionToken],
    [Hash, Url],
    [Hash, BadUrl],
    [Hash, '-'],
    [Hash, NumberToken],
    [Hash, Percentage],
    [Hash, Dimension],
    [Hash, CDC],

    [Dimension, Ident],
    [Dimension, FunctionToken],
    [Dimension, Url],
    [Dimension, BadUrl],
    [Dimension, '-'],
    [Dimension, NumberToken],
    [Dimension, Percentage],
    [Dimension, Dimension],
    [Dimension, CDC],

    ['#', Ident],
    ['#', FunctionToken],
    ['#', Url],
    ['#', BadUrl],
    ['#', '-'],
    ['#', NumberToken],
    ['#', Percentage],
    ['#', Dimension],

    ['-', Ident],
    ['-', FunctionToken],
    ['-', Url],
    ['-', BadUrl],
    ['-', '-'],
    ['-', NumberToken],
    ['-', Percentage],
    ['-', Dimension],

    [NumberToken, Ident],
    [NumberToken, FunctionToken],
    [NumberToken, Url],
    [NumberToken, BadUrl],
    [NumberToken, NumberToken],
    [NumberToken, Percentage],
    [NumberToken, Dimension],

    ['@', Ident],
    ['@', FunctionToken],
    ['@', Url],
    ['@', BadUrl],
    ['@', '-'],

    ['.', NumberToken],
    ['.', Percentage],
    ['.', Dimension],

    ['+', NumberToken],
    ['+', Percentage],
    ['+', Dimension],

    ['/', '*']
];
const safePairs = specPairs.concat([
    [AtKeyword, LeftParenthesis],
    [AtKeyword, StringToken],
    [AtKeyword, Colon],

    [RightParenthesis, Ident],
    [RightParenthesis, FunctionToken],
    [RightParenthesis, Url],

    [Url, Ident],
    [Url, FunctionToken],
    [Url, Url]
]);

function createMap(pairs) {
    const isWhiteSpaceRequired = new Set(
        pairs.map(([prev, next]) => (code(prev) << 16 | code(next)))
    );

    return function(prevCode, type, value) {
        const nextCode = code(type, value);
        const nextCharCode = value.charCodeAt(0);
        const emitWs = nextCharCode === HYPHENMINUS || nextCharCode === PLUSSIGN
            ? isWhiteSpaceRequired.has(prevCode << 16 | nextCharCode << 8)
            : isWhiteSpaceRequired.has(prevCode << 16 | nextCode);

        if (emitWs) {
            this.emit(' ', WhiteSpace, true);
        }

        return nextCode;
    };
}

export const spec = createMap(specPairs);
export const safe = createMap(safePairs);
