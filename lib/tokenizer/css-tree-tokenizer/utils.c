#include "utils.h"

uint16_t get_char_code(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  return offset < source_length ? source[offset] : 0;
}

uint32_t get_new_line_length(const uint16_t* source, uint32_t source_length, uint32_t offset, uint16_t code) {
  if (code == 13 /* \r */ && get_char_code(source, source_length, offset + 1) == 10 /* \n */) {
    return 2;
  }
  return 1;
}

int32_t math_min(int32_t a, int32_t b) {
  return a < b ? a : b;
}

bool cmp_char(const uint16_t* test_str, const uint32_t test_str_length, uint32_t offset, uint16_t reference_code) {
  if (offset >= test_str_length) {
    return false;
  }
  int16_t code = test_str[offset];
  // code.toLowerCase() for A..Z
  if (is_uppercase_letter(code)) {
    code = code | 32;
  }

  return code == reference_code;
}

bool cmp_str(const uint16_t* test_str, uint32_t test_str_length, int32_t start, int32_t end, uint16_t* reference_str, uint32_t reference_str_length) {
  if (end - start != reference_str_length) {
    return false;
  }
  if (start < 0 || end > test_str_length) {
    return false;
  }
  for(int32_t i = start; i < end; i++) {
    int32_t reference_str_offset = i - start;
    if (reference_str_offset < 0 || reference_str_offset >= reference_str_length || i < 0 || i >= test_str_length) {
      return false;
    }
    int16_t reference_code = reference_str[i - start];
    int16_t test_code = test_str[i];

    // testCode.toLowerCase() for A..Z
    if (is_uppercase_letter(test_code)) {
      test_code = test_code | 32;
    }

    if (test_code != reference_code) {
      return false;
    }
  }

  return true;
}

uint32_t find_white_space_start(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  for(; offset >= 0; offset--) {
    if (offset > source_length || !is_white_space(source[offset])) {
      break;
    }
  }
  return offset + 1;
}

uint32_t find_white_space_end(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  for(; offset < source_length; offset++) {
    if (!is_white_space(source[offset])) {
      break;
    }
  }
  return offset;
}

uint32_t find_decimal_number_end(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  for(; offset < source_length; offset++) {
    if (!is_digit(source[offset])) {
      break;
    }
  }
  return offset;
}


// § 4.3.7. Consume an escaped code point
uint32_t consume_escaped(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  // It assumes that the U+005C REVERSE SOLIDUS (\) has already been consumed and
  // that the next input code point has already been verified to be part of a valid escape.
  offset += 2;

  // hex digit
  if (is_hex_digit(get_char_code(source, source_length, offset - 1))) {
      // Consume as many hex digits as possible, but no more than 5.
      // Note that this means 1-6 hex digits have been consumed in total.
      uint32_t maxOffset = (uint32_t)math_min(source_length, offset + 5);
      for (; offset < maxOffset; offset++) {
          if (offset > source_length || !is_hex_digit(get_char_code(source, source_length, offset))) {
              break;
          }
      }

      // If the next input code point is whitespace, consume it as well.
      uint16_t code = get_char_code(source, source_length, offset);
      if (is_white_space(code)) {
          offset += get_new_line_length(source, source_length, offset, code);
      }
  }

  return offset;
}

// §4.3.11. Consume a name
// Note: This algorithm does not do the verification of the first few code points that are necessary
// to ensure the returned code points would constitute an <ident-token>. If that is the intended use,
// ensure that the stream starts with an identifier before calling this algorithm.
uint32_t consume_name(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  // Let result initially be an empty string.
  // Repeatedly consume the next input code point from the stream:
  for (; offset < source_length; offset++) {
    uint16_t code = source[offset];

    // name code point
    if (is_name(code)) {
        // Append the code point to result.
        continue;
    }

    // the stream starts with a valid escape
    if (is_valid_escape(code, get_char_code(source, source_length, offset + 1))) {
        // Consume an escaped code point. Append the returned code point to result.
        offset = consume_escaped(source, source_length, offset) - 1;
        continue;
    }

    // anything else
    // Reconsume the current input code point. Return result.
    break;
  }

  return offset;
}

// §4.3.12. Consume a number
uint32_t consume_number(const uint16_t* source, uint32_t source_length, uint32_t offset)  {
  uint16_t code;
  if (offset < source_length) {
    code = source[offset];
    // 2. If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
    // consume it and append it to repr.
    if (code == 0x002B || code == 0x002D) {
        offset++;
    }

    if (offset < source_length) {
      code = source[offset];

      // 3. While the next input code point is a digit, consume it and append it to repr.
      if (is_digit(code)) {
          offset = find_decimal_number_end(source, source_length, offset + 1);
          code = source[offset];
      }
      if (offset + 1 < source_length) {
        // 4. If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
        if (code == 0x002E && is_digit(source[offset + 1])) {
            // 4.1 Consume them.
            // 4.2 Append them to repr.
            offset += 2;

            // 4.3 Set type to "number".
            // TODO

            // 4.4 While the next input code point is a digit, consume it and append it to repr.

            offset = find_decimal_number_end(source, source_length, offset);
        }
      }
    }

    if (cmp_char(source, source_length, offset, 101u /*e*/)) {
      uint32_t sign = 0;
      if (offset + 1 < source_length) {
        code = source[offset + 1];
        bool is_NaN = false;
        // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
        if (code == 0x002D || code == 0x002B) {
            sign = 1;
            if (offset + 2 < source_length) {
                code = source[offset + 2];
            } else {
              is_NaN = true;
            }
        }

        // ... followed by a digit
        if (!is_NaN && is_digit(code)) {
            // 5.1 Consume them.
            // 5.2 Append them to repr.

            // 5.3 Set type to "number".
            // TODO

            // 5.4 While the next input code point is a digit, consume it and append it to repr.
            offset = find_decimal_number_end(source, source_length, offset + 1 + sign + 1);
        }
      }
    }
  }
  return offset;
}

// § 4.3.14. Consume the remnants of a bad url
// ... its sole use is to consume enough of the input stream to reach a recovery point
// where normal tokenizing can resume.
uint32_t consume_bad_url_remnants(const uint16_t* source, uint32_t source_length, uint32_t offset) {
  // Repeatedly consume the next input code point from the stream:
  for (; offset < source_length; offset++) {
      uint16_t code = source[offset];

      // U+0029 RIGHT PARENTHESIS ())
      // EOF
      if (code == 0x0029) {
          // Return.
          offset++;
          break;
      }

      if (is_valid_escape(code, get_char_code(source, source_length, offset + 1))) {
          // Consume an escaped code point.
          // Note: This allows an escaped right parenthesis ("\)") to be encountered
          // without ending the <bad-url-token>. This is otherwise identical to
          // the "anything else" clause.
          offset = consume_escaped(source,source_length, offset);
      }
  }

  return offset;
}

// // § 4.3.7. Consume an escaped code point
// // Note: This algorithm assumes that escaped is valid without leading U+005C REVERSE SOLIDUS (\)
// uint16_t* decode_escaped(const char* escaped, uint32_t escaped_length) {
//   // Single char escaped that's not a hex digit
//   if (escaped_length == 1 && !is_hex_digit(escaped[0])) {
//       return escaped[0];
//   }

//   // Interpret the hex digits as a hexadecimal number.
//   uint16_t code = parseInt(escaped, 16);

//   if (
//       (code == 0) ||                       // If this number is zero,
//       (code >= 0xD800 && code <= 0xDFFF) || // or is for a surrogate,
//       (code > 0x10FFFF)                     // or is greater than the maximum allowed code point
//   ) {
//       // ... return U+FFFD REPLACEMENT CHARACTER
//       code = 0xFFFD;
//   }

//   // Otherwise, return the code point with that value.
//   return String.fromCodePoint(code);
// }
