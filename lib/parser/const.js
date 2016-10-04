// token types (note: value shouldn't intersect with using char codes)
var WHITESPACE = 1;
var IDENTIFIER = 2;
var NUMBER = 3;
var STRING = 4;
var COMMENT = 5;
var PUNCTUATION = 6;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;

var TokenType = {
    Whitespace:   WHITESPACE,
    Identifier:   IDENTIFIER,
    Number:           NUMBER,
    String:           STRING,
    Comment:         COMMENT,
    Punctuation: PUNCTUATION,

    ExclamationMark:    33,  // !
    QuotationMark:      34,  // "
    NumberSign:         35,  // #
    DollarSign:         36,  // $
    PercentSign:        37,  // %
    Ampersand:          38,  // &
    Apostrophe:         39,  // '
    LeftParenthesis:    40,  // (
    RightParenthesis:   41,  // )
    Asterisk:           42,  // *
    PlusSign:           43,  // +
    Comma:              44,  // ,
    HyphenMinus:        45,  // -
    FullStop:           46,  // .
    Solidus:            47,  // /
    Colon:              58,  // :
    Semicolon:          59,  // ;
    LessThanSign:       60,  // <
    EqualsSign:         61,  // =
    GreaterThanSign:    62,  // >
    QuestionMark:       63,  // ?
    CommercialAt:       64,  // @
    LeftSquareBracket:  91,  // [
    RightSquareBracket: 93,  // ]
    CircumflexAccent:   94,  // ^
    LowLine:            95,  // _
    LeftCurlyBracket:  123,  // {
    VerticalLine:      124,  // |
    RightCurlyBracket: 125,  // }
    Tilde:             126   // ~
};

var TokenName = Object.keys(TokenType).reduce(function(result, key) {
    result[TokenType[key]] = key;
    return result;
}, {});

var punctuation = [
    TokenType.ExclamationMark,    // '!'
    TokenType.QuotationMark,      // '"'
    TokenType.NumberSign,         // '#'
    TokenType.DollarSign,         // '$'
    TokenType.PercentSign,        // '%'
    TokenType.Ampersand,          // '&'
    TokenType.Apostrophe,         // '\''
    TokenType.LeftParenthesis,    // '('
    TokenType.RightParenthesis,   // ')'
    TokenType.Asterisk,           // '*'
    TokenType.PlusSign,           // '+'
    TokenType.Comma,              // ','
    TokenType.HyphenMinus,        // '-'
    TokenType.FullStop,           // '.'
    TokenType.Solidus,            // '/'
    TokenType.Colon,              // ':'
    TokenType.Semicolon,          // ';'
    TokenType.LessThanSign,       // '<'
    TokenType.EqualsSign,         // '='
    TokenType.GreaterThanSign,    // '>'
    TokenType.QuestionMark,       // '?'
    TokenType.CommercialAt,       // '@'
    TokenType.LeftSquareBracket,  // '['
    TokenType.RightSquareBracket, // ']'
    TokenType.CircumflexAccent,   // '^'
    TokenType.LeftCurlyBracket,   // '{'
    TokenType.VerticalLine,       // '|'
    TokenType.RightCurlyBracket,  // '}'
    TokenType.Tilde               // '~'
];
var SYMBOL_CATEGORY_LENGTH = Math.max.apply(null, punctuation) + 1;
var SYMBOL_CATEGORY = new Uint32Array(SYMBOL_CATEGORY_LENGTH);
var IS_PUNCTUATION = new Uint32Array(SYMBOL_CATEGORY_LENGTH);

for (var i = 0; i < SYMBOL_CATEGORY.length; i++) {
    SYMBOL_CATEGORY[i] = IDENTIFIER;
}

// fill categories
punctuation.forEach(function(key) {
    SYMBOL_CATEGORY[Number(key)] = PUNCTUATION;
    IS_PUNCTUATION[Number(key)] = PUNCTUATION;
}, SYMBOL_CATEGORY);

IS_PUNCTUATION[TokenType.HyphenMinus] = 0;
// whitespace is punctuator
IS_PUNCTUATION[SPACE] = PUNCTUATION;
IS_PUNCTUATION[TAB] = PUNCTUATION;
IS_PUNCTUATION[N] = PUNCTUATION;
IS_PUNCTUATION[R] = PUNCTUATION;
IS_PUNCTUATION[F] = PUNCTUATION;

for (var i = 48; i <= 57; i++) {
    SYMBOL_CATEGORY[i] = NUMBER;
}

SYMBOL_CATEGORY[SPACE] = WHITESPACE;
SYMBOL_CATEGORY[TAB] = WHITESPACE;
SYMBOL_CATEGORY[N] = WHITESPACE;
SYMBOL_CATEGORY[R] = WHITESPACE;
SYMBOL_CATEGORY[F] = WHITESPACE;

SYMBOL_CATEGORY[TokenType.Apostrophe] = STRING;
SYMBOL_CATEGORY[TokenType.QuotationMark] = STRING;

module.exports = {
    TokenType: TokenType,
    TokenName: TokenName,

    SYMBOL_CATEGORY: SYMBOL_CATEGORY,
    IS_PUNCTUATION: IS_PUNCTUATION
};
