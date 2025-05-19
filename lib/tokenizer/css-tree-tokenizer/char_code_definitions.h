#ifndef TOKENIZER_CHAR_DEFS_H
#define TOKENIZER_CHAR_DEFS_H

#include <stdint.h>
#include <stdbool.h>

#define Eof_Category 0x80
#define WhiteSpace_Category 0x82
#define Digit_Category 0x83
#define NameStart_Category 0x84
#define NonPrintable_Category 0x85

// digit
// A code point between U+0030 DIGIT ZERO (0) and U+0039 DIGIT NINE (9).
#define is_digit(code) ((code) >= 0x0030 && (code) <= 0x0039)

// hex digit
// A digit, or a code point between U+0041 LATIN CAPITAL LETTER A (A) and U+0046 LATIN CAPITAL LETTER F (F),
// or a code point between U+0061 LATIN SMALL LETTER A (a) and U+0066 LATIN SMALL LETTER F (f).
#define is_hex_digit(code) ((is_digit(code)) || \
                              ((code) >= 0x0041 && (code) <= 0x0046) /* A-F */ || \
                              ((code) >= 0x0061 && (code) <= 0x0066)) /* a-f */

// uppercase letter
// A code point between U+0041 LATIN CAPITAL LETTER A (A) and U+005A LATIN CAPITAL LETTER Z (Z).
#define is_uppercase_letter(code) ((code) >= 0x0041 && (code) <= 0x005A)


// lowercase letter
// A code point between U+0061 LATIN SMALL LETTER A (a) and U+007A LATIN SMALL LETTER Z (z).
#define is_lowercase_letter(code) ((code) >= 0x0061 && (code) <= 0x007A)

// letter
// An uppercase letter or a lowercase letter.
#define is_letter(code) ((is_uppercase_letter(code)) || (is_lowercase_letter(code)))

// non-ASCII code point
// A code point with a value equal to or greater than U+0080 <control>.
//
// 2024-09-02: The latest spec narrows the range for non-ASCII characters (see https://github.com/csstree/csstree/issues/188).
// However, all modern browsers support a wider range, and strictly following the latest spec could result
// in some CSS being parsed incorrectly, even though it works in the browser. Therefore, this function adheres
// to the previous, broader definition of non-ASCII characters.
#define is_non_ascii(code) ((code) >= 0x0080)


// name-start code point
// A letter, a non-ASCII code point, or U+005F LOW LINE (_).
#define is_name_start(code) (is_letter(code) || is_non_ascii(code) || code == 0x005F)

// name code point
// A name-start code point, a digit, or U+002D HYPHEN-MINUS (-).
#define is_name(code) (is_name_start(code) || is_digit(code) || code == 0x002D)

// non-printable code point
// A code point between U+0000 NULL and U+0008 BACKSPACE, or U+000B LINE TABULATION,
// or a code point between U+000E SHIFT OUT and U+001F INFORMATION SEPARATOR ONE, or U+007F DELETE.
#define is_non_printable(code) ( \
         ((code) >= 0x0000 && (code) <= 0x0008) || \
         ((code) == 0x000B) || \
         ((code) >= 0x000E && (code) <= 0x001F) || \
         ((code) == 0x007F) \
)

// newline
// U+000A LINE FEED. Note that U+000D CARRIAGE RETURN and U+000C FORM FEED are not included in this definition,
// as they are converted to U+000A LINE FEED during preprocessing.
// TODO: we doesn't do a preprocessing, so check a code point for U+000D CARRIAGE RETURN and U+000C FORM FEED
#define is_newline(code) ((code) == 0x000A || (code) == 0x000D || (code) == 0x000C)

// whitespace
// A newline, U+0009 CHARACTER TABULATION, or U+0020 SPACE.
#define is_white_space(code) (is_newline(code) || code == 0x0009 || code == 0x0020)


// § 4.3.8. Check if two code points are a valid escape
#define is_valid_escape(first, second) \
    /* If the first code point is not U+005C REVERSE SOLIDUS (\), return false. \
    // Otherwise, if the second code point is a newline or EOF, return false.*/ \
    ((((first) != 0x005C) || (is_newline(second)) || ((second) == 0) /*EOF*/) ? false : true)

#define is_bom(code) ((code) == 0xFEFF || (code) == 0xFFFE) ? 1 : 0

void initialize_category_map();

bool is_identifier_start(uint16_t first, uint16_t second, uint16_t third);
bool is_number_start(uint16_t first, uint16_t second, uint16_t third);

uint32_t char_code_category(uint16_t char_code);

#endif // TOKENIZER_CHAR_DEFS_H