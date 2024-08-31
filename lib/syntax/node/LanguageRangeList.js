import { Comma, String as StringToken, Ident } from '../../tokenizer/index.js';

export const name = 'LanguageRangeList';
export const structure = {
    children: [[
        'Identifier',
        'String'
    ]]
};

// https://drafts.csswg.org/selectors/#the-lang-pseudo
// The :lang() pseudo-class, which accepts a comma-separated list of one or more language ranges,
// represents an element whose content language is one of the languages listed in its argument.
// Each language range in :lang() must be a valid CSS <ident> or <string>.
export function parse() {
    const children = this.createList();

    this.skipSC();

    while (!this.eof) {
        switch (this.tokenType) {
            case Ident:
                children.push(this.Identifier());
                break;

            case StringToken:
                children.push(this.String());
                break;

            default:
                this.error('Identifier or string is expected');
        }

        if (this.lookupTypeNonSC(0) !== Comma) {
            break;
        }

        this.skipSC();
        this.next();
        this.skipSC();
    }

    return {
        type: 'LanguageRangeList',
        loc: this.getLocationFromList(children),
        children
    };
}

export function generate(node) {
    this.children(node, () => this.token(Comma, ','));
}
