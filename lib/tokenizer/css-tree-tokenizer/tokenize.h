#ifndef TOKENIZE_H
#define TOKENIZE_H
#include <emscripten.h>
#include <stdint.h>
#include "char_code_definitions.h"
#include "types.h"
#include "utils.h"
void consume_numeric_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type);
void consume_ident_like_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type);
void consume_url_token(const uint16_t* source, int32_t source_length, int32_t* offset, TokenType* type);
void consume_string_token(const uint16_t* source, int32_t source_length, uint32_t ending_code_point, int32_t* offset, TokenType* type);
EMSCRIPTEN_KEEPALIVE
void tokenize(const uint16_t* source, int32_t source_length);
// int32_t* tokenize(const uint16_t* source, int32_t source_length);
EMSCRIPTEN_KEEPALIVE
int init();
EM_JS(void, on_token, (uint32_t type, uint32_t start, uint32_t end), {
    globalThis._tokenizer_on_token_callback(type, start, end);
});
#endif