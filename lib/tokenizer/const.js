// CSS Syntax Module Level 3
// https://www.w3.org/TR/css-syntax-3/
// Token types (note: value shouldn't intersect with used char codes)
var IDENTIFIER = 2;             // <ident-token>
var FUNCTION = 15;              // <function-token>
var ATKEYWORD = 14;             // <at-keyword-token>
var HASH = 18;                  // <hash-token>
var STRING = 4;                 // <string-token>
var BAD_STRING = NaN;           // <bad-string-token>  TODO: implement
var URL = 16;                   // <url-token>
var BAD_URL = NaN;              // <bad-url-token>     TODO: implement
var PUNCTUATOR = 6;             // <delim-token>       TODO: rename to delim
var NUMBER = 3;                 // <number-token>
var PERCENTAGE = 20;            // <percentage-token>
var DIMENSION = 19;             // <dimension-token>
var WHITESPACE = 1;             // <whitespace-token>
var CDO = 7;                    // <CDO-token>
var CDC = 8;                    // <CDC-token>
var COLON = 58;                 // <color-token>       TODO: implement
var SEMICOLON = 59;             // <semicolon-token>   TODO: implement
var COMMA = 44;                 // <comma-token>       TODO: implement
var LEFT_SQUARE_BRACKET = 91;   // <[-token>           TODO: implement
var RIGHT_SQUARE_BRACKET = 93;  // <]-token>           TODO: implement
var LEFT_PARENTHESIS = 40;      // <(-token>           TODO: implement
var RIGHT_PARENTHESIS = 41;     // <)-token>           TODO: implement
var LEFT_CURLY_BRACKET = 123;   // <{-token>           TODO: implement
var RIGHT_CURLY_BRACKET = 125;  // <}-token>           TODO: implement
var COMMENT = 5;
var RAW = 17;                   // TODO: remove

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;

var TYPE = {
    Identifier:   IDENTIFIER,
    Function:       FUNCTION,
    AtKeyword:     ATKEYWORD,
    Hash:               HASH,
    String:           STRING,
    BadString:    BAD_STRING,
    Url:                 URL,
    BadUrl:          BAD_URL,
    Punctuator:   PUNCTUATOR,  // TODO: rename to delim
    Number:           NUMBER,
    Percentage:   PERCENTAGE,
    Dimension:     DIMENSION,
    WhiteSpace:   WHITESPACE,
    CDO:                 CDO,
    CDC:                 CDC,
    Colon:             COLON,  // <color-token>     :
    Semicolon:     SEMICOLON,  // <semicolon-token> ;
    Comma:             COMMA,  // <comma-token>     ,
    LeftSquareBracket: LEFT_SQUARE_BRACKET,   // <[-token>
    RightSquareBracket: RIGHT_SQUARE_BRACKET, // <]-token>
    LeftParenthesis: LEFT_PARENTHESIS,        // <(-token>
    RightParenthesis: RIGHT_PARENTHESIS,      // <)-token>
    LeftCurlyBracket: LEFT_CURLY_BRACKET,     // <{-token>
    RightCurlyBracket: RIGHT_CURLY_BRACKET,   // <}-token>
    Comment:         COMMENT,
    Raw:                 RAW   // TODO: remove
};

var CHARCODE = {
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

var NAME = Object.keys(TYPE).reduce(function(result, key) {
    result[TYPE[key]] = key;
    return result;
}, {});
Object.keys(CHARCODE).forEach(function(key) {
    NAME[CHARCODE[key]] = key;
}, {});

// https://drafts.csswg.org/css-syntax/#tokenizer-definitions
// > non-ASCII code point
// >   A code point with a value equal to or greater than U+0080 <control>
// > name-start code point
// >   A letter, a non-ASCII code point, or U+005F LOW LINE (_).
// > name code point
// >   A name-start code point, a digit, or U+002D HYPHEN-MINUS (-)
// That means only ASCII code points has a special meaning and we a maps for 0..127 codes only
var SafeUint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : Array; // fallback on Array when TypedArray is not supported
var SYMBOL_TYPE = new SafeUint32Array(0x80);
var PUNCTUATION = new SafeUint32Array(0x80);
var STOP_URL_RAW = new SafeUint32Array(0x80);

for (var i = 0; i < SYMBOL_TYPE.length; i++) {
    SYMBOL_TYPE[i] = IDENTIFIER;
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
    SYMBOL_TYPE[Number(key)] = PUNCTUATOR;
    PUNCTUATION[Number(key)] = PUNCTUATOR;
});

for (var i = 48; i <= 57; i++) {
    SYMBOL_TYPE[i] = NUMBER;
}

SYMBOL_TYPE[SPACE] = WHITESPACE;
SYMBOL_TYPE[TAB] = WHITESPACE;
SYMBOL_TYPE[N] = WHITESPACE;
SYMBOL_TYPE[R] = WHITESPACE;
SYMBOL_TYPE[F] = WHITESPACE;

SYMBOL_TYPE[CHARCODE.Apostrophe] = STRING;
SYMBOL_TYPE[CHARCODE.QuotationMark] = STRING;

STOP_URL_RAW[SPACE] = 1;
STOP_URL_RAW[TAB] = 1;
STOP_URL_RAW[N] = 1;
STOP_URL_RAW[R] = 1;
STOP_URL_RAW[F] = 1;
STOP_URL_RAW[CHARCODE.Apostrophe] = 1;
STOP_URL_RAW[CHARCODE.QuotationMark] = 1;
STOP_URL_RAW[CHARCODE.LeftParenthesis] = 1;
STOP_URL_RAW[CHARCODE.RightParenthesis] = 1;

// whitespace is punctuation ...
PUNCTUATION[SPACE] = PUNCTUATOR;
PUNCTUATION[TAB] = PUNCTUATOR;
PUNCTUATION[N] = PUNCTUATOR;
PUNCTUATION[R] = PUNCTUATOR;
PUNCTUATION[F] = PUNCTUATOR;
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
