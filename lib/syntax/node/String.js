import { String as StringToken } from '../../tokenizer/index.js';
import { APOSTROPHE, decode, encode } from '../../utils/string.js';

export const name = 'String';
export const structure = {
    value: String,
    apostrophe: [null, Boolean]
};

export function parse() {
    const loc = this.getLocation(this.tokenStart, this.tokenEnd);
    const stringToken = this.consume(StringToken);

    return {
        type: 'String',
        loc,
        value: decode(stringToken),
        apostrophe: stringToken.charCodeAt(0) == APOSTROPHE
    };
}

export function generate(node) {
    this.token(StringToken, encode(node.value, node.apostrophe || false));
}
