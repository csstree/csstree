#include "char_code_definitions.h"
// https://drafts.csswg.org/css-syntax-3/
// § 4.2. Definitions

// digit
// A code point between U+0030 DIGIT ZERO (0) and U+0039 DIGIT NINE (9).
bool is_digit(uint16_t code) {
    return code >= 0x0030 && code <= 0x0039;
}

// hex digit
// A digit, or a code point between U+0041 LATIN CAPITAL LETTER A (A) and U+0046 LATIN CAPITAL LETTER F (F),
// or a code point between U+0061 LATIN SMALL LETTER A (a) and U+0066 LATIN SMALL LETTER F (f).
bool is_hex_digit(uint16_t code) {
    return is_digit(code) ||
           (code >= 0x0041 && code <= 0x0046) || // A-F
           (code >= 0x0061 && code <= 0x0066);   // a-f
}

// uppercase letter
// A code point between U+0041 LATIN CAPITAL LETTER A (A) and U+005A LATIN CAPITAL LETTER Z (Z).
bool is_uppercase_letter(uint16_t code) {
    return code >= 0x0041 && code <= 0x005A;
}

// lowercase letter
// A code point between U+0061 LATIN SMALL LETTER A (a) and U+007A LATIN SMALL LETTER Z (z).
bool is_lowercase_letter(uint16_t code) {
    return code >= 0x0061 && code <= 0x007A;
}

// letter
// An uppercase letter or a lowercase letter.
bool is_letter(uint16_t code) {
    return is_uppercase_letter(code) || is_lowercase_letter(code);
}

// non-ASCII code point
// A code point with a value equal to or greater than U+0080 <control>.
//
// 2024-09-02: The latest spec narrows the range for non-ASCII characters (see https://github.com/csstree/csstree/issues/188).
// However, all modern browsers support a wider range, and strictly following the latest spec could result
// in some CSS being parsed incorrectly, even though it works in the browser. Therefore, this function adheres
// to the previous, broader definition of non-ASCII characters.
bool is_non_ascii(uint16_t code) {
    return code >= 0x0080;
}

// name-start code point
// A letter, a non-ASCII code point, or U+005F LOW LINE (_).
bool is_name_start(uint16_t code) {
    return is_letter(code) || is_non_ascii(code) || code == 0x005F;
}

// name code point
// A name-start code point, a digit, or U+002D HYPHEN-MINUS (-).
bool is_name(uint16_t code) {
    return is_name_start(code) || is_digit(code) || code == 0x002D;
}


// non-printable code point
// A code point between U+0000 NULL and U+0008 BACKSPACE, or U+000B LINE TABULATION,
// or a code point between U+000E SHIFT OUT and U+001F INFORMATION SEPARATOR ONE, or U+007F DELETE.
bool is_non_printable(uint16_t code) {
    return (code >= 0x0000 && code <= 0x0008) ||
           (code == 0x000B) ||
           (code >= 0x000E && code <= 0x001F) ||
           (code == 0x007F);
}

// newline
// U+000A LINE FEED. Note that U+000D CARRIAGE RETURN and U+000C FORM FEED are not included in this definition,
// as they are converted to U+000A LINE FEED during preprocessing.
// TODO: we doesn't do a preprocessing, so check a code point for U+000D CARRIAGE RETURN and U+000C FORM FEED
bool is_newline(uint16_t code) {
    return code == 0x000A || code == 0x000D || code == 0x000C;
}

// whitespace
// A newline, U+0009 CHARACTER TABULATION, or U+0020 SPACE.
bool is_white_space(uint16_t code) {
    return is_newline(code) || code == 0x0009 || code == 0x0020;
}


// § 4.3.8. Check if two code points are a valid escape
bool is_valid_escape(uint16_t first, uint16_t second) {
    // If the first code point is not U+005C REVERSE SOLIDUS (\), return false.
    if (first != 0x005C) {
        return false;
    }

    // Otherwise, if the second code point is a newline or EOF, return false.
    if (is_newline(second) || second == EOF) {
        return false;
    }

    // Otherwise, return true.
    return true;
}

// § 4.3.9. Check if three code points would start an identifier
bool is_identifier_start(uint16_t first, uint16_t second, uint16_t third) {
    // Look at the first code point:

    // U+002D HYPHEN-MINUS
    if (first == 0x002D) {
        // If the second code point is a name-start code point or a U+002D HYPHEN-MINUS,
        // or the second and third code points are a valid escape, return true. Otherwise, return false.
        return (
            is_name_start(second) ||
            second == 0x002D ||
            is_valid_escape(second, third)
        );
    }

    // name-start code point
    if (is_name_start(first)) {
        // Return true.
        return true;
    }

    // U+005C REVERSE SOLIDUS (\)
    if (first == 0x005C) {
        // If the first and second code points are a valid escape, return true. Otherwise, return false.
        return is_valid_escape(first, second);
    }

    // anything else
    // Return false.
    return false;
}


// § 4.3.10. Check if three code points would start a number
bool is_number_start(uint16_t first, uint16_t second, uint16_t third) {
    // Look at the first code point:

    // U+002B PLUS SIGN (+)
    // U+002D HYPHEN-MINUS (-)
    if (first == 0x002B || first == 0x002D) {
        // If the second code point is a digit, return true.
        if (is_digit(second)) {
            return 2;
        }

        // Otherwise, if the second code point is a U+002E FULL STOP (.)
        // and the third code point is a digit, return true.
        // Otherwise, return false.
        return second == 0x002E && is_digit(third) ? 3 : 0;
    }

    // U+002E FULL STOP (.)
    if (first == 0x002E) {
        // If the second code point is a digit, return true. Otherwise, return false.
        return is_digit(second) ? 2 : 0;
    }

    // digit
    if (is_digit(first)) {
        // Return true.
        return 1;
    }

    // anything else
    // Return false.
    return 0;
}

bool is_bom(uint16_t code) {
    // UTF-16BE
    if (code == 0xFEFF) {
        return 1;
    }

    // UTF-16LE
    if (code == 0xFFFE) {
        return 1;
    }

    return 0;
}


uint16_t CATEGORY[0x80];

void initialize_category_map() {
    CATEGORY[0] = Eof_Category;
    for (int i = 1; i < 0x80; i++) {
        if (is_white_space(i)) CATEGORY[i] = WhiteSpace_Category; 
        else if (is_digit(i)) CATEGORY[i] = Digit_Category; 
        else if (is_name_start(i)) CATEGORY[i] = NameStart_Category; 
        else if (is_non_printable(i)) CATEGORY[i] = NonPrintable_Category;
        else CATEGORY[i] = i; // Direct mapping for others like delimiters
    }
}

uint32_t char_code_category(uint16_t char_code) {
    return char_code < 0x80 ? CATEGORY[char_code] : NameStart_Category;
}
