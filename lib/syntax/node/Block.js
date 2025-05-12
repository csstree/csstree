import {
    WhiteSpace,
    Comment,
    Delim,
    Semicolon,
    Hash,
    Colon,
    AtKeyword,
    LeftSquareBracket,
    LeftCurlyBracket,
    RightCurlyBracket
} from '../../tokenizer/index.js';

const AMPERSAND = 0x0026;       // U+0026 AMPERSAND (&)
const DOT = 0x002E;             // U+002E FULL STOP (.)
const STAR = 0x002A;            // U+002A ASTERISK (*);

const selectorStarts = new Set([
    AMPERSAND,
    DOT,
    STAR
]);

function consumeRaw() {
    return this.Raw(null, true);
}
function consumeRule() {
    return this.parseWithFallback(this.Rule, consumeRaw);
}
function consumeRawDeclaration() {
    return this.Raw(this.consumeUntilSemicolonIncluded, true);
}
function consumeDeclaration() {
    if (this.tokenType === Semicolon) {
        return consumeRawDeclaration.call(this, this.tokenIndex);
    }

    const node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

    if (this.tokenType === Semicolon) {
        this.next();
    }

    return node;
}

function isSelectorStart() {
    return this.tokenType === Delim && selectorStarts.has(this.source.charCodeAt(this.tokenStart)) ||
        this.tokenType === Hash || this.tokenType === LeftSquareBracket ||
        this.tokenType === Colon;
}

export const name = 'Block';
export const walkContext = 'block';
export const structure = {
    children: [[
        'Atrule',
        'Rule',
        'Declaration'
    ]]
};

export function parse(isStyleBlock) {
    const consumer = isStyleBlock ? consumeDeclaration : consumeRule;
    const start = this.tokenStart;
    let children = this.createList();

    this.eat(LeftCurlyBracket);

    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case RightCurlyBracket:
                break scan;

            case WhiteSpace:
            case Comment:
                this.next();
                break;

            case AtKeyword:
                children.push(this.parseWithFallback(this.Atrule.bind(this, isStyleBlock), consumeRaw));
                break;

            default:
                if (isStyleBlock && isSelectorStart.call(this)) {
                    children.push(consumeRule.call(this));
                } else {
                    children.push(consumer.call(this));
                }
        }
    }

    if (!this.eof) {
        this.eat(RightCurlyBracket);
    }

    return {
        type: 'Block',
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}

export function generate(node) {
    this.token(LeftCurlyBracket, '{');
    this.children(node, prev => {
        if (prev.type === 'Declaration') {
            this.token(Semicolon, ';');
        }
    });
    this.token(RightCurlyBracket, '}');
}
