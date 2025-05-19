#ifndef UTILS_H
#define UTILS_H
#include <stdint.h>
#include <stdbool.h>

#include "char_code_definitions.h"

#define NaN -1

uint16_t get_char_code(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t get_new_line_length(const uint16_t* source, uint32_t source_length, uint32_t offset, uint16_t code);

int32_t math_min(int32_t a, int32_t b);

bool cmp_char(const uint16_t* test_str, const uint32_t test_str_length, uint32_t offset, uint16_t reference_code);

bool cmp_str(const uint16_t* test_str, uint32_t test_str_length, int32_t start, int32_t end, uint16_t* reference_str, uint32_t reference_str_length);

uint32_t find_white_space_start(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t find_white_space_end(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t find_decimal_number_end(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t consume_escaped(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t consume_name(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t consume_number(const uint16_t* source, uint32_t source_length, uint32_t offset);

uint32_t consume_bad_url_remnants(const uint16_t* source, uint32_t source_length, uint32_t offset);

#endif