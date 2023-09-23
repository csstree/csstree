import {
    WhiteSpace,
    Comment,
    Ident,
    LeftParenthesis,
    RightParenthesis,
    Function as FunctionToken,
    Colon,
    EOF
} from '../../tokenizer/index.js';

const MediaFeatureToken = new Set([Colon, RightParenthesis, EOF]);
const SupportsFeatureToken = new Set([Colon, EOF]);

export const name = 'Condition';
export const structure = {
    kind: String,
    children: [[
        'Identifier',
        'Feature',
        'FeatureRange'
    ]]
};

export const conditions = {
    media() {
        if (this.tokenType === LeftParenthesis) {
            const firstToken = this.lookupTypeNonSC(1);
            if (firstToken === Ident && MediaFeatureToken.has(this.lookupTypeNonSC(2))) {
                return this.Feature('media');
            } else if (firstToken !== LeftParenthesis) {
                return this.parseWithFallback(() => this.FeatureRange('media'), (startIndex) => {
                    this.skip(startIndex - this.tokenIndex);
                });
            }
        }
    },
    supports() {
        if (this.tokenType === LeftParenthesis) {
            if (this.lookupTypeNonSC(1) === Ident && SupportsFeatureToken.has(this.lookupTypeNonSC(2))) {
                return this.SupportsFeature();
            }
        } else if (this.tokenType === FunctionToken) {
            return this.SupportsFeature();
        }
    },
    container() {
        if (this.tokenType === LeftParenthesis) {
            if (this.lookupTypeNonSC(1) === Ident && MediaFeatureToken.has(this.lookupTypeNonSC(2))) {
                return this.Feature('size');
            } else if (this.lookupTypeNonSC(1) !== LeftParenthesis) {
                return this.FeatureRange('size');
            }
        } else {
            // style()
        }
    }
};

function consumeGeneralEnclosed(startIndex) {
    this.skip(startIndex - this.tokenIndex);
    return this.GeneralEnclosed();
}

export function parse(kind = 'media') {
    const children = this.createList();
    const termParser = conditions[kind];

    scan: while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
            case WhiteSpace:
                this.next();
                continue;

            case Ident:
                children.push(this.Identifier());
                break;

            case LeftParenthesis: {
                let term = termParser.call(this);
                // this.parseWithFallback(
                //     () => termParser.call(this),
                //     consumeGeneralEnclosed
                // );

                if (!term) {
                    term = this.parseWithFallback(() => {
                        this.eat(LeftParenthesis);
                        const res = this.Condition(kind);
                        this.eat(RightParenthesis);
                        return res;
                    }, consumeGeneralEnclosed);
                }

                children.push(term);
                break;
            }

            case FunctionToken: {
                let term = this.parseWithFallback(
                    () => termParser.call(this),
                    consumeGeneralEnclosed
                );

                if (!term) {
                    term = this.GeneralEnclosed();
                }

                children.push(term);
                break;
            }

            default:
                break scan;
        }
    }

    if (children.isEmpty) {
        this.error('Condition is expected');
    }

    return {
        type: 'Condition',
        loc: this.getLocationFromList(children),
        kind,
        children
    };
}

export function generate(node) {
    node.children.forEach(child => {
        if (child.type === 'Condition') {
            this.token(LeftParenthesis, '(');
            this.node(child);
            this.token(RightParenthesis, ')');
        } else {
            this.node(child);
        }
    });
}

