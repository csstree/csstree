import { isDigit, Delim, Number as NumberToken } from '../../tokenizer/index.js';

const SOLIDUS = 0x002F;  // U+002F SOLIDUS (/)
const FULLSTOP = 0x002E; // U+002E FULL STOP (.)

// Media Queries Level 3 defines terms of <ratio> as a positive (not zero or negative)
// integers (see https://drafts.csswg.org/mediaqueries-3/#values)
// However, Media Queries Level 4 removes any definition of values
// (see https://drafts.csswg.org/mediaqueries-4/#values) and refers to
// CSS Values and Units for detail. In CSS Values and Units Level 4 a <ratio>
// definition was added (see https://drafts.csswg.org/css-values-4/#ratios) which
// defines ratio as "<number [0,∞]> [ / <number [0,∞]> ]?" and based on it
// any constrains on terms were removed. Parser also doesn't test numbers
// in any way to make possible for linting and fixing them by the tools using CSSTree.
// An additional syntax examination may be applied by a lexer.
function consumeNumber() {
    this.skipSC();

    const value = this.consume(NumberToken);

    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (!isDigit(code) && code !== FULLSTOP) {
            this.error('Unsigned number is expected', this.tokenStart - value.length + i);
        }
    }

    if (Number(value) === 0) {
        this.error('Zero number is not allowed', this.tokenStart - value.length);
    }

    return value;
}

export const name = 'Ratio';
export const structure = {
    left: String,
    right: String
};

// <number [0,∞]> [ / <number [0,∞]> ]?
export function parse() {
    const start = this.tokenStart;
    const left = consumeNumber.call(this);
    let right;

    this.skipSC();
    this.eatDelim(SOLIDUS);
    right = consumeNumber.call(this);

    return {
        type: 'Ratio',
        loc: this.getLocation(start, this.tokenStart),
        left,
        right
    };
}

export function generate(node) {
    this.token(NumberToken, node.left);
    this.token(Delim, '/');
    this.token(NumberToken, node.right);
}
