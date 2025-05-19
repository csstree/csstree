import initWasm from '../../binary/tokenizer.js';

const tokenizer = await initWasm();
tokenizer._init();
export function tokenize(source, onToken) {
  const sourcePtr = tokenizer._malloc((source.length + 1) * 2);
  tokenizer.stringToUTF16(source, sourcePtr, (source.length + 1) * 2);
  globalThis._tokenizer_on_token_callback = onToken;
  tokenizer._tokenize(sourcePtr, source.length);
  globalThis._tokenizer_on_token_callback = null;
  tokenizer._free(sourcePtr);
}
