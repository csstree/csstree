import {
    WhiteSpace,
    Comment,
    AtKeyword,
    CDO,
    CDC
} from '../../tokenizer/index.js';

const EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)
const STAR = 0x002A; // U+002A ASTERISK (*)
const SOLIDUS = 0x002F; // U+002F SOLIDUS (/)

function consumeRaw() {
    return this.Raw(null, false);
}

export const name = 'StyleSheet';
export const walkContext = 'stylesheet';
export const structure = {
    children: [[
        'Comment',
        'CDO',
        'CDC',
        'Atrule',
        'Rule',
        'Raw'
    ]]
};

export function parse() {
    const start = this.tokenStart;
    const children = this.createList();
    let child;

    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case WhiteSpace:
                this.next();
                continue;

            case Comment:

                if (this.strict && this.charCodeAt(this.tokenEnd) !== SOLIDUS && this.charCodeAt(this.tokenEnd - 1) !== STAR) {
                    this.error('Unclosed comment');
                }


                // ignore comments except exclamation comments (i.e. /*! .. */) on top level
                if (this.charCodeAt(this.tokenStart + 2) !== EXCLAMATIONMARK) {
                    this.next();
                    continue;
                }

                child = this.Comment();
                break;

            case CDO: // <!--
                child = this.CDO();
                break;

            case CDC: // -->
                child = this.CDC();
                break;

            // CSS Syntax Module Level 3
            // §2.2 Error handling
            // At the "top level" of a stylesheet, an <at-keyword-token> starts an at-rule.
            case AtKeyword:
                child = this.parseWithFallback(this.Atrule, consumeRaw);
                break;

            // Anything else starts a qualified rule ...
            default:
                child = this.parseWithFallback(this.Rule, consumeRaw);
        }

        children.push(child);
    }

    return {
        type: 'StyleSheet',
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}

export function generate(node) {
    this.children(node);
}
