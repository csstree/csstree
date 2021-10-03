import { Hash } from '../../tokenizer/index.js';

export const name = 'IdSelector';
export const structure = {
    name: String
};

export function parse() {
    const start = this.tokenStart;

    // TODO: check value is an ident
    this.eat(Hash);

    return {
        type: 'IdSelector',
        loc: this.getLocation(start, this.tokenStart),
        name: this.substrToCursor(start + 1)
    };
}

export function generate(node) {
    this.token(Hash, '#' + node.name);
}
