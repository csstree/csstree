#ifndef TOKENIZER_CHAR_DEFS_H
#define TOKENIZER_CHAR_DEFS_H

#include <stdint.h>
#include <stdbool.h>

#define EOF 0
#define Eof_Category 0x80
#define WhiteSpace_Category 0x82
#define Digit_Category 0x83
#define NameStart_Category 0x84
#define NonPrintable_Category 0x85

void initialize_category_map();

bool is_digit(uint16_t code);
bool is_hex_digit(uint16_t code);
bool is_uppercase_letter(uint16_t code);
bool is_lowercase_letter(uint16_t code);
bool is_letter(uint16_t code);
bool is_non_ascii(uint16_t code);
bool is_name_start(uint16_t code);
bool is_name(uint16_t code);
bool is_non_printable(uint16_t code);
bool is_newline(uint16_t code);
bool is_white_space(uint16_t code);
bool is_valid_escape(uint16_t first, uint16_t second);
bool is_identifier_start(uint16_t first, uint16_t second, uint16_t third);
bool is_number_start(uint16_t first, uint16_t second, uint16_t third);
bool is_bom(uint16_t code);

uint32_t char_code_category(uint16_t char_code);

#endif // TOKENIZER_CHAR_DEFS_H