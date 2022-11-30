import {
    WhiteSpace,
    Comment,
    Ident,
    LeftParenthesis,
    RightParenthesis,
    Colon,
    EOF
} from '../../tokenizer/index.js';

const MediaFeatureToken = new Set([Colon, RightParenthesis, EOF]);

export const name = 'MediaCondition';
export const structure = {
    children: [[
        'Identifier',
        'MediaFeature',
    ]]
};

export function parse() {
    const children = this.createList();

    scan: while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
            case WhiteSpace:
                this.next();
                continue;

            case Ident:
                children.push(this.Identifier());
                break;

            case LeftParenthesis:
                if (this.lookupTypeNonSC(1) === Ident && MediaFeatureToken.has(this.lookupTypeNonSC(2))) {
                    children.push(this.MediaFeature());
                } else if (this.lookupTypeNonSC(1) === LeftParenthesis || this.lookupTypeNonSC(2) === LeftParenthesis) {
                    this.next();
                    children.push(this.MediaCondition());
                    this.eat(RightParenthesis);
                }

                break;

            default:
                break scan;
        }
    }

    return {
        type: 'MediaCondition',
        loc: this.getLocationFromList(children),
        children
    };
}

export function generate(node) {
    this.children(node);
}

