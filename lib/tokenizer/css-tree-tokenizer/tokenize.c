#include "tokenize.h"


// § 4.3.3. Consume a numeric token
void consume_numeric_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type) {
  // Consume a number and let number be the result.
  *offset = consume_number(source, source_length, *offset);

  // If the next 3 input code points would start an identifier, then:
  if (is_identifier_start(get_char_code(source, source_length, *offset), get_char_code(source, source_length, *offset + 1), get_char_code(source, source_length, *offset + 2))) {
      // Create a <dimension-token> with the same value and type flag as number, and a unit set initially to the empty string.
      // Consume a name. Set the <dimension-token>’s unit to the returned value.
      // Return the <dimension-token>.
      *type = TOKEN_DIMENSION;
      *offset = consume_name(source, source_length, *offset);
      return;
  }

  // Otherwise, if the next input code point is U+0025 PERCENTAGE SIGN (%), consume it.
  if (get_char_code(source, source_length, *offset) == 0x0025) {
      // Create a <percentage-token> with the same value as number, and return it.
      *type =  TOKEN_PERCENTAGE;
      (*offset)++;
      return;
  }

  // Otherwise, create a <number-token> with the same value and type flag as number, and return it.
  *type = TOKEN_NUMBER;
}

    // § 4.3.4. Consume an ident-like token
void consume_ident_like_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type) {
    uint32_t name_start_offset = *offset;

    // Consume a name, and let string be the result.
    *offset = consume_name(source, source_length, *offset);

    // If string’s value is an ASCII case-insensitive match for "url",
    // and the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
    uint16_t url_str[3] = {'u', 'r', 'l'};
    if (cmp_str(source, source_length, name_start_offset, *offset, url_str, 3) && get_char_code(source, source_length, *offset) == 0x0028) {
        // While the next two input code points are whitespace, consume the next input code point.
        *offset = find_white_space_end(source, source_length, (*offset) + 1);

        // If the next one or two input code points are U+0022 QUOTATION MARK ("), U+0027 APOSTROPHE ('),
        // or whitespace followed by U+0022 QUOTATION MARK (") or U+0027 APOSTROPHE ('),
        // then create a <function-token> with its value set to string and return it.
        if (get_char_code(source, source_length, *offset) == 0x0022 ||
            get_char_code(source, source_length, *offset) == 0x0027) {
            *type = TOKEN_FUNCTION;
            *offset = name_start_offset + 4;
            return;
        }

        // Otherwise, consume a url token, and return it.
        consume_url_token(source, source_length, offset, type);
        return;
    }

    // Otherwise, if the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
    // Create a <function-token> with its value set to string and return it.
    if (get_char_code(source, source_length, *offset) == 0x0028) {
        *type = TOKEN_FUNCTION;
        (*offset)++;
        return;
    }

    // Otherwise, create an <ident-token> with its value set to string and return it.
    *type = TOKEN_IDENT;
}

void consume_string_token(const uint16_t* source, int32_t source_length, uint32_t ending_code_point, int32_t* offset, TokenType* type) {
  // This algorithm may be called with an ending code point, which denotes the code point
  // that ends the string. If an ending code point is not specified,
  // the current input code point is used.
  if (!ending_code_point) {
    ending_code_point = get_char_code(source, source_length, *offset);
    *offset = (*offset) + 1;
  }

  // Initially create a <string-token> with its value set to the empty string.
  *type = TOKEN_STRING;

  for (; *offset < source_length; (*offset)++) {
    uint16_t code = source[*offset];
    uint32_t char_code = char_code_category(code);
    // ending code point
    if (char_code == ending_code_point) {
      // Return the <string-token>.
      (*offset)++;
      return;

      // EOF
      // case EofCategory:
      // This is a parse error. Return the <string-token>.
      // return;
    }

    switch (char_code_category(code)) {
        // newline
        case WhiteSpace_Category:
            if (is_newline(code)) {
                // This is a parse error. Reconsume the current input code point,
                // create a <bad-string-token>, and return it.
                *offset += get_new_line_length(source, source_length, *offset, code);
                *type = TOKEN_BAD_STRING;
                return;
            }
            break;

        // U+005C REVERSE SOLIDUS (\)
        case 0x005C:
            // If the next input code point is EOF, do nothing.
            if (*offset == source_length - 1) {
                break;
            }

            uint16_t next_code = get_char_code(source, source_length, (*offset) + 1);

            // Otherwise, if the next input code point is a newline, consume it.
            if (is_newline(next_code)) {
                *offset += get_new_line_length(source, source_length, (*offset) + 1, next_code);
            } else if (is_valid_escape(code, next_code)) {
                // Otherwise, (the stream starts with a valid escape) consume
                // an escaped code point and append the returned code point to
                // the <string-token>’s value.
                *offset = consume_escaped(source, source_length, *offset) - 1;
            }
            break;
        // anything else
        // Append the current input code point to the <string-token>’s value.
    }
  }

}



  // § 4.3.6. Consume a url token
  // Note: This algorithm assumes that the initial "url(" has already been consumed.
  // This algorithm also assumes that it’s being called to consume an "unquoted" value, like url(foo).
  // A quoted value, like url("foo"), is parsed as a <function-token>. Consume an ident-like token
  // automatically handles this distinction; this algorithm shouldn’t be called directly otherwise.
void consume_url_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type) {
      // Initially create a <url-token> with its value set to the empty string.
      *type = TOKEN_URL;

      // Consume as much whitespace as possible.
      *offset = find_white_space_end(source, source_length, *offset);

      // Repeatedly consume the next input code point from the stream:
      for (; (*offset) < source_length; (*offset)++) {
          uint16_t code = source[*offset];

          switch (char_code_category(code)) {
              // U+0029 RIGHT PARENTHESIS ())
              case 0x0029:
                  // Return the <url-token>.
                  (*offset)++;
                  return;

                  // EOF
                  // case EofCategory:
                  // This is a parse error. Return the <url-token>.
                  // return;

              // whitespace
              case WhiteSpace_Category:
                  // Consume as much whitespace as possible.
                  *offset = find_white_space_end(source, source_length, *offset);

                  // If the next input code point is U+0029 RIGHT PARENTHESIS ()) or EOF,
                  // consume it and return the <url-token>
                  // (if EOF was encountered, this is a parse error);
                  if (get_char_code(source, source_length, *offset) == 0x0029 || (*offset) >= source_length) {
                      if ((*offset) < source_length) {
                          (*offset)++;
                      }
                      return;
                  }

                  // otherwise, consume the remnants of a bad url, create a <bad-url-token>,
                  // and return it.
                  *offset = consume_bad_url_remnants(source, source_length, *offset);
                  *type = TOKEN_BAD_URL;
                  return;

              // U+0022 QUOTATION MARK (")
              // U+0027 APOSTROPHE (')
              // U+0028 LEFT PARENTHESIS (()
              // non-printable code point
              case 0x0022:
              case 0x0027:
              case 0x0028:
              case NonPrintable_Category:
                  // This is a parse error. Consume the remnants of a bad url,
                  // create a <bad-url-token>, and return it.
                  *offset = consume_bad_url_remnants(source, source_length, *offset);
                  *type = TOKEN_BAD_URL;
                  return;

              // U+005C REVERSE SOLIDUS (\)
              case 0x005C:
                  // If the stream starts with a valid escape, consume an escaped code point and
                  // append the returned code point to the <url-token>’s value.
                  if (is_valid_escape(code, get_char_code(source, source_length, (*offset) + 1))) {
                      *offset = consume_escaped(source, source_length, *offset) - 1;
                      break;
                  }

                  // Otherwise, this is a parse error. Consume the remnants of a bad url,
                  // create a <bad-url-token>, and return it.
                  *offset = consume_bad_url_remnants(source, source_length, *offset);
                  *type = TOKEN_BAD_URL;
                  return;

              // anything else
              // Append the current input code point to the <url-token>’s value.
          }
      }
  }

// returns [length, start, end, type, start, end, type, ....]
void tokenize(const uint16_t* source, int32_t source_length) {
  // int32_t tokens_size = 128;
  // int32_t tokens_occupied = 1;
  // int32_t* tokens = (int32_t*)malloc(sizeof(int32_t) * tokens_size); // Placeholder for token storage

  int32_t start = is_bom(get_char_code(source, source_length, 0));
  int32_t offset = start;
  TokenType type;
  while(offset < source_length) {
    int16_t code = source[offset];
    switch ((char_code_category(code))) {
      // whitespace
      case WhiteSpace_Category:
          // Consume as much whitespace as possible. Return a <whitespace-token>.
          type = TOKEN_WHITESPACE;
          offset = find_white_space_end(source, source_length, offset + 1);
          break;
      // U+0022 QUOTATION MARK (")
      case 0x0022:
        // Consume a string token and return it.
        consume_string_token(source, source_length, 0, &offset, &type);
        break;
      // U+0023 NUMBER SIGN (#)
      case 0x0023:
        // If the next input code point is a name code point or the next two input code points are a valid escape, then:
        if (is_name(get_char_code(source, source_length, offset + 1)) || is_valid_escape(get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2))) {
            // Create a <hash-token>.
            type = TOKEN_HASH;

            // If the next 3 input code points would start an identifier, set the <hash-token>’s type flag to "id".
            // if (is_identifier_start(get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2), get_char_code(source, source_length, offset + 3))) {
            //     // TODO: set id flag
            // }

            // Consume a name, and set the <hash-token>’s value to the returned string.
            offset = consume_name(source, source_length, offset + 1);

            // Return the <hash-token>.
        } else {
            // Otherwise, return a <delim-token> with its value set to the current input code point.
            type = TOKEN_DELIM;
            offset++;
        }

      break;

      // U+0027 APOSTROPHE (')
      case 0x0027:
        // Consume a string token and return it.
        consume_string_token(source, source_length, 0, &offset, &type);
        break;

      // U+0028 LEFT PARENTHESIS (()
      case 0x0028:
        // Return a <(-token>.
        type = TOKEN_LEFT_PARENTHESIS;
        offset++;
        break;

      // U+0029 RIGHT PARENTHESIS ())
      case 0x0029:
        // Return a <)-token>.
        type = TOKEN_RIGHT_PARENTHESIS;
        offset++;
        break;

      // U+002B PLUS SIGN (+)
      case 0x002B:
        // If the input stream starts with a number, ...
        if (is_number_start(code, get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2))) {
            // ... reconsume the current input code point, consume a numeric token, and return it.
            consume_numeric_token(source, source_length, &offset, &type);
        } else {
            // Otherwise, return a <delim-token> with its value set to the current input code point.
            type = TOKEN_DELIM;
            offset++;
        }
        break;

        // U+002C COMMA (,)
        case 0x002C:
          // Return a <comma-token>.
          type = TOKEN_COMMA;
          offset++;
          break;

        // U+002D HYPHEN-MINUS (-)
        case 0x002D:
          // If the input stream starts with a number, reconsume the current input code point, consume a numeric token, and return it.
          if (is_number_start(code, get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2))) {
            consume_numeric_token(source, source_length, &offset, &type);
          } else {
            // Otherwise, if the next 2 input code points are U+002D HYPHEN-MINUS U+003E GREATER-THAN SIGN (->), consume them and return a <CDC-token>.
            if (get_char_code(source, source_length, offset + 1) == 0x002D &&
                get_char_code(source, source_length, offset + 2) == 0x003E) {
                type = TOKEN_CDC;
                offset = offset + 3;
            } else {
              // Otherwise, if the input stream starts with an identifier, ...
              if (is_identifier_start(code, get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2))) {
                  // ... reconsume the current input code point, consume an ident-like token, and return it.
                  consume_ident_like_token(source, source_length, &offset, &type);
              } else {
                  // Otherwise, return a <delim-token> with its value set to the current input code point.
                  type = TOKEN_DELIM;
                  offset++;
              }
            }
          }
          break;

          // U+002E FULL STOP (.)
          case 0x002E:
            // If the input stream starts with a number, ...
            if (is_number_start(code, get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2))) {
                // ... reconsume the current input code point, consume a numeric token, and return it.
                consume_numeric_token(source, source_length, &offset, &type);
            } else {
                // Otherwise, return a <delim-token> with its value set to the current input code point.
                type = TOKEN_DELIM;
                offset++;
            }

            break;

          // U+002F SOLIDUS (/)
          case 0x002F:
            // If the next two input code point are U+002F SOLIDUS (/) followed by a U+002A ASTERISK (*),
            if (get_char_code(source, source_length, offset + 1) == 0x002A) {
                // ... consume them and all following code points up to and including the first U+002A ASTERISK (*)
                // followed by a U+002F SOLIDUS (/), or up to an EOF code point.
                type = TOKEN_COMMENT;
                // implement of the indexOf function
                bool is_found = false;
                for(uint32_t ii = offset + 2; ii < source_length - 1; ii++) {
                  if (source[ii] == '*' && source[ii + 1] == '/') {
                    is_found = true;
                    offset = ii;
                    break;
                  }
                }
                offset = is_found ? offset + 2 : source_length;
            } else {
                type = TOKEN_DELIM;
                offset++;
            }
            break;

          // U+003A COLON (:)
          case 0x003A:
            // Return a <colon-token>.
            type = TOKEN_COLON;
            offset++;
            break;

          // U+003B SEMICOLON (;)
          case 0x003B:
            // Return a <semicolon-token>.
            type = TOKEN_SEMICOLON;
            offset++;
            break;

          // U+003C LESS-THAN SIGN (<)
          case 0x003C:
            // If the next 3 input code points are U+0021 EXCLAMATION MARK U+002D HYPHEN-MINUS U+002D HYPHEN-MINUS (!--), ...
            if (get_char_code(source, source_length, offset + 1) == 0x0021 &&
                get_char_code(source, source_length, offset + 2) == 0x002D &&
                get_char_code(source, source_length, offset + 3) == 0x002D) {
                // ... consume them and return a <CDO-token>.
                type = TOKEN_CDO;
                offset = offset + 4;
            } else {
                // Otherwise, return a <delim-token> with its value set to the current input code point.
                type = TOKEN_DELIM;
                offset++;
            }

            break;

          // U+0040 COMMERCIAL AT (@)
          case 0x0040:
            // If the next 3 input code points would start an identifier, ...
            if (is_identifier_start(get_char_code(source, source_length, offset + 1), get_char_code(source, source_length, offset + 2), get_char_code(source, source_length, offset + 3))) {
                // ... consume a name, create an <at-keyword-token> with its value set to the returned value, and return it.
                type = TOKEN_AT_KEYWORD;
                offset = consume_name(source, source_length, offset + 1);
            } else {
                // Otherwise, return a <delim-token> with its value set to the current input code point.
                type = TOKEN_DELIM;
                offset++;
            }

            break;

          // U+005B LEFT SQUARE BRACKET ([)
          case 0x005B:
            // Return a <[-token>.
            type = TOKEN_LEFT_SQUARE_BRACKET;
            offset++;
            break;

          // U+005C REVERSE SOLIDUS (\)
          case 0x005C:
            // If the input stream starts with a valid escape, ...
            if (is_valid_escape(code, get_char_code(source, source_length, offset + 1))) {
                // ... reconsume the current input code point, consume an ident-like token, and return it.
                consume_ident_like_token(source, source_length, &offset, &type);
            } else {
                // Otherwise, this is a parse error. Return a <delim-token> with its value set to the current input code point.
                type = TOKEN_DELIM;
                offset++;
            }
            break;

          // U+005D RIGHT SQUARE BRACKET (])
          case 0x005D:
            // Return a <]-token>.
            type = TOKEN_RIGHT_SQUARE_BRACKET;
            offset++;
            break;

          // U+007B LEFT CURLY BRACKET ({)
          case 0x007B:
            // Return a <{-token>.
            type = TOKEN_LEFT_CURLY_BRACKET;
            offset++;
            break;

          // U+007D RIGHT CURLY BRACKET (})
          case 0x007D:
          // Return a <}-token>.
          type = TOKEN_RIGHT_CURLY_BRACKET;
          offset++;
          break;

          // digit
          case Digit_Category:
            // Reconsume the current input code point, consume a numeric token, and return it.
            consume_numeric_token(source, source_length, &offset, &type);
            break;

          // name-start code point
          case NameStart_Category:
            // Reconsume the current input code point, consume an ident-like token, and return it.
            consume_ident_like_token(source, source_length, &offset, &type);
            break;

          // EOF
          // case EofCategory:
          // Return an <EOF-token>.
          // break;

          // anything else
          default:
            // Return a <delim-token> with its value set to the current input code point.
            type = TOKEN_DELIM;
            offset++;
    }


    // if (tokens_occupied + 3 > tokens_size) {
    //   // Resize the tokens array if necessary
    //   tokens_size *= 2;
    //   tokens = (int32_t*)realloc(tokens, sizeof(int32_t) * tokens_size);
    // }
    // tokens[tokens_occupied++] = start;
    // tokens[tokens_occupied++] = offset;
    // tokens[tokens_occupied++] = type;
    on_token(type, start, offset);
    start = offset;
  }
  // tokens[0] = tokens_occupied;;
}

int init() {
  initialize_category_map();
  return 0;
}