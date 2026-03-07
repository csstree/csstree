#ifndef TOKENIZER_TYPES_H
#define TOKENIZER_TYPES_H

// CSS Syntax Module Level 3
// https://www.w3.org/TR/css-syntax-3/
typedef enum {
    TOKEN_EOF = 0,                 // <EOF-token>
    TOKEN_IDENT,               // <ident-token>
    TOKEN_FUNCTION,            // <function-token>
    TOKEN_AT_KEYWORD,          // <at-keyword-token>
    TOKEN_HASH,                // <hash-token>
    TOKEN_STRING,              // <string-token>
    TOKEN_BAD_STRING,          // <bad-string-token>
    TOKEN_URL,                 // <url-token>
    TOKEN_BAD_URL,             // <bad-url-token>
    TOKEN_DELIM,               // <delim-token>
    TOKEN_NUMBER,              // <number-token>
    TOKEN_PERCENTAGE,          // <percentage-token>
    TOKEN_DIMENSION,           // <dimension-token>
    TOKEN_WHITESPACE,          // <whitespace-token>
    TOKEN_CDO,                 // <CDO-token>
    TOKEN_CDC,                 // <CDC-token>
    TOKEN_COLON,               // <colon-token>     :
    TOKEN_SEMICOLON,           // <semicolon-token> ;
    TOKEN_COMMA,               // <comma-token>     ,
    TOKEN_LEFT_SQUARE_BRACKET, // <[-token>
    TOKEN_RIGHT_SQUARE_BRACKET,// <]-token>
    TOKEN_LEFT_PARENTHESIS,    // <(-token>
    TOKEN_RIGHT_PARENTHESIS,   // <)-token>
    TOKEN_LEFT_CURLY_BRACKET,  // <{-token>
    TOKEN_RIGHT_CURLY_BRACKET, // <}-token>
    TOKEN_COMMENT
} TokenType;

#endif // TOKENIZER_TYPES_H