#include "char_code_definitions.h"
// https://drafts.csswg.org/css-syntax-3/
// § 4.2. Definitions




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
            return (bool)2;
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
        return (bool)1;
    }

    // anything else
    // Return false.
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
