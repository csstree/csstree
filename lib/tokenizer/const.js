// CSS Syntax Module Level 3
// https://www.w3.org/TR/css-syntax-3/
// Token types (note: value shouldn't intersect with used char codes)
var TYPE = {
    Identifier: 1,          // <ident-token>
    Function: 2,            // <function-token>
    AtKeyword: 3,           // <at-keyword-token>
    Hash: 4,                // <hash-token>
    String: 5,              // <string-token>
    BadString: 6,           // <bad-string-token>   TODO: implement
    Url: 7,                 // <url-token>
    BadUrl: 8,              // <bad-url-token>      TODO: implement
    Delim: 9,               // <delim-token>
    Number: 10,             // <number-token>
    Percentage: 11,         // <percentage-token>
    Dimension: 12,          // <dimension-token>
    WhiteSpace: 13,         // <whitespace-token>
    CDO: 14,                // <CDO-token>
    CDC: 15,                // <CDC-token>
    Colon: 16,              // <colon-token>     :  TODO: implement
    Semicolon: 17,          // <semicolon-token> ;  TODO: implement
    Comma: 18,              // <comma-token>     ,  TODO: implement
    LeftSquareBracket:  19, // <[-token>
    RightSquareBracket: 20, // <]-token>
    LeftParenthesis: 21,    // <(-token>
    RightParenthesis: 22,   // <)-token>
    LeftCurlyBracket: 23,   // <{-token>
    RightCurlyBracket: 24,  // <}-token>
    Comment: 25,
    Raw: 26                 // TODO: remove
};

var CHARCODE = {
    Tab:                   9,  // \t
    LineFeed:             10,  // \n
    FormFeed:             12,  // \f
    CarriageReturn:       13,  // \r
    Space:                32,
    ExclamationMark:      33,  // !
    QuotationMark:        34,  // "
    NumberSign:           35,  // #
    DollarSign:           36,  // $
    PercentSign:          37,  // %
    Ampersand:            38,  // &
    Apostrophe:           39,  // '
    LeftParenthesis:      40,  // (
    RightParenthesis:     41,  // )
    Asterisk:             42,  // *
    PlusSign:             43,  // +
    Comma:                44,  // ,
    HyphenMinus:          45,  // -
    FullStop:             46,  // .
    Solidus:              47,  // /
    Colon:                58,  // :
    Semicolon:            59,  // ;
    LessThanSign:         60,  // <
    EqualsSign:           61,  // =
    GreaterThanSign:      62,  // >
    QuestionMark:         63,  // ?
    CommercialAt:         64,  // @
    LeftSquareBracket:    91,  // [
    Backslash:            92,  // \
    RightSquareBracket:   93,  // ]
    CircumflexAccent:     94,  // ^
    LowLine:              95,  // _
    GraveAccent:          96,  // `
    LeftCurlyBracket:    123,  // {
    VerticalLine:        124,  // |
    RightCurlyBracket:   125,  // }
    Tilde:               126   // ~
};

var NAME = Object.keys(CHARCODE).reduce(function(result, key) {
    result[CHARCODE[key]] = key;
    return result;
}, {});
Object.keys(TYPE).forEach(function(key) {
    NAME[TYPE[key]] = key;
}, {});

// https://drafts.csswg.org/css-syntax/#tokenizer-definitions
// > non-ASCII code point
// >   A code point with a value equal to or greater than U+0080 <control>
// > name-start code point
// >   A letter, a non-ASCII code point, or U+005F LOW LINE (_).
// > name code point
// >   A name-start code point, a digit, or U+002D HYPHEN-MINUS (-)
// That means only ASCII code points has a special meaning and we define a maps for 0..127 codes only
var SafeUint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : Array; // fallback on Array when TypedArray is not supported
var SYMBOL_TYPE = new SafeUint32Array(0x80);
var PUNCTUATION = new SafeUint32Array(0x80);
var STOP_URL_RAW = new SafeUint32Array(0x80);

for (var i = 0; i < SYMBOL_TYPE.length; i++) {
    SYMBOL_TYPE[i] = TYPE.Identifier;
}

// fill categories
[
    CHARCODE.ExclamationMark,    // !
    CHARCODE.QuotationMark,      // "
    CHARCODE.NumberSign,         // #
    CHARCODE.DollarSign,         // $
    CHARCODE.PercentSign,        // %
    CHARCODE.Ampersand,          // &
    CHARCODE.Apostrophe,         // '
    CHARCODE.LeftParenthesis,    // (
    CHARCODE.RightParenthesis,   // )
    CHARCODE.Asterisk,           // *
    CHARCODE.PlusSign,           // +
    CHARCODE.Comma,              // ,
    CHARCODE.HyphenMinus,        // -
    CHARCODE.FullStop,           // .
    CHARCODE.Solidus,            // /
    CHARCODE.Colon,              // :
    CHARCODE.Semicolon,          // ;
    CHARCODE.LessThanSign,       // <
    CHARCODE.EqualsSign,         // =
    CHARCODE.GreaterThanSign,    // >
    CHARCODE.QuestionMark,       // ?
    CHARCODE.CommercialAt,       // @
    CHARCODE.LeftSquareBracket,  // [
    // CHARCODE.Backslash,          // \
    CHARCODE.RightSquareBracket, // ]
    CHARCODE.CircumflexAccent,   // ^
    // CHARCODE.LowLine,            // _
    CHARCODE.GraveAccent,        // `
    CHARCODE.LeftCurlyBracket,   // {
    CHARCODE.VerticalLine,       // |
    CHARCODE.RightCurlyBracket,  // }
    CHARCODE.Tilde               // ~
].forEach(function(key) {
    SYMBOL_TYPE[Number(key)] = TYPE.Delim;
    PUNCTUATION[Number(key)] = TYPE.Delim;
});

for (var i = 48; i <= 57; i++) {
    SYMBOL_TYPE[i] = TYPE.Number;
}

SYMBOL_TYPE[CHARCODE.Tab] = TYPE.WhiteSpace;
SYMBOL_TYPE[CHARCODE.LineFeed] = TYPE.WhiteSpace;
SYMBOL_TYPE[CHARCODE.FormFeed] = TYPE.WhiteSpace;
SYMBOL_TYPE[CHARCODE.CarriageReturn] = TYPE.WhiteSpace;
SYMBOL_TYPE[CHARCODE.Space] = TYPE.WhiteSpace;

SYMBOL_TYPE[CHARCODE.Apostrophe] = TYPE.String;
SYMBOL_TYPE[CHARCODE.QuotationMark] = TYPE.String;

STOP_URL_RAW[CHARCODE.Tab] = 1;
STOP_URL_RAW[CHARCODE.LineFeed] = 1;
STOP_URL_RAW[CHARCODE.FormFeed] = 1;
STOP_URL_RAW[CHARCODE.CarriageReturn] = 1;
STOP_URL_RAW[CHARCODE.Space] = 1;
STOP_URL_RAW[CHARCODE.Apostrophe] = 1;
STOP_URL_RAW[CHARCODE.QuotationMark] = 1;
STOP_URL_RAW[CHARCODE.LeftParenthesis] = 1;
STOP_URL_RAW[CHARCODE.RightParenthesis] = 1;

// whitespace is punctuation ...
PUNCTUATION[CHARCODE.Tab] = TYPE.Delim;
PUNCTUATION[CHARCODE.LineFeed] = TYPE.Delim;
PUNCTUATION[CHARCODE.FormFeed] = TYPE.Delim;
PUNCTUATION[CHARCODE.CarriageReturn] = TYPE.Delim;
PUNCTUATION[CHARCODE.Space] = TYPE.Delim;
// ... hyper minus is not
PUNCTUATION[CHARCODE.HyphenMinus] = 0;

module.exports = {
    TYPE: TYPE,
    NAME: NAME,

    CHARCODE: CHARCODE,
    SYMBOL_TYPE: SYMBOL_TYPE,
    PUNCTUATION: PUNCTUATION,
    STOP_URL_RAW: STOP_URL_RAW
};
