import {
    Ident,
    Number,
    Dimension,
    LeftParenthesis,
    RightParenthesis,
    Delim
} from '../../tokenizer/index.js';

const LESSTHANSIGN = 60;    // <
const EQUALSIGN = 61;       // =
const GREATERTHANSIGN = 62; // >

export const name = 'MediaFeatureRange';
export const structure = {
    left: ['Identifier', 'Number', 'Dimension', 'Ratio'],
    leftComparison: String,
    middle: ['Identifier', 'Number', 'Dimension', 'Ratio'],
    rightComparison: [String, null],
    right: ['Identifier', 'Number', 'Dimension', 'Ratio', null]
};

function readTerm() {
    this.skipSC();

    switch (this.tokenType) {
        case Number:
            if (this.lookupNonWSType(1) === Delim) {
                return this.Ratio();
            } else {
                return this.Number();
            }

        case Dimension:
            return this.Dimension();

        case Ident:
            return this.Identifier();

        default:
            this.error('Number, dimension, ratio or identifier is expected');
    }
}

function readComparison(expectColon) {
    this.skipSC();

    if (this.isDelim(LESSTHANSIGN) ||
        this.isDelim(GREATERTHANSIGN)) {
        const value = this.source[this.tokenStart];

        this.next();

        if (this.isDelim(EQUALSIGN)) {
            this.next();
            return value + '=';
        }

        return value;
    }

    if (this.isDelim(EQUALSIGN)) {
        return '=';
    }

    this.error(`Expected ${expectColon ? '":", ' : ''}"<", ">", "=" or ")"`);
}

export function parse() {
    const start = this.tokenStart;

    this.skipSC();
    this.eat(LeftParenthesis);

    const left = readTerm.call(this);
    const leftComparison = readComparison.call(this, left.type === 'Identifier');
    const middle = readTerm.call(this);
    let rightComparison = null;
    let right = null;

    if (this.lookupNonWSType(0) !== RightParenthesis) {
        rightComparison = readComparison.call(this);
        right = readTerm.call(this);
    }

    this.skipSC();
    this.eat(RightParenthesis);

    return {
        type: 'MediaFeatureRange',
        loc: this.getLocation(start, this.tokenStart),
        left,
        leftComparison,
        middle,
        rightComparison,
        right
    };
}

export function generate(node) {
    this.token(LeftParenthesis, '(');
    this.node(node.left);
    this.tokenize(node.leftComparison);
    this.node(node.middle);

    if (node.right) {
        this.tokenize(node.rightComparison);
        this.node(node.right);
    }

    this.token(RightParenthesis, ')');
}
