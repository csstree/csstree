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
                this.next();
                this.skipSC();
                const res = this.Declaration();
                this.eat(RightParenthesis);
                return res;
            }
        } else {
            // selector()
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

                if (!term) {
                    term = this.parseWithFallback(() => {
                        this.next();
                        const res = this.Condition(kind);
                        this.eat(RightParenthesis);
                        return res;
                    }, (startIndex) => {
                        this.skip(startIndex - this.tokenIndex);
                        return this.GeneralEnclosed();
                    });
                }

                children.push(term);
                break;
            }

            case FunctionToken: {
                let term = termParser.call(this);

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
        if (child.type === 'Condition' || child.type === 'Declaration') {
            this.token(LeftParenthesis, '(');
            this.node(child);
            this.token(RightParenthesis, ')');
        } else {
            this.node(child);
        }
    });
}

