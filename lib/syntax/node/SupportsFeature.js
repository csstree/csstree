import {
    Function as FunctionToken,
    LeftParenthesis,
    RightParenthesis
} from '../../tokenizer/index.js';

export const name = 'SupportsFeature';
export const structure = {
    feature: String,
    value: ['Declaration', 'Selector']
};

export function parse() {
    const start = this.tokenStart;
    let featureName = 'declaration';
    let valueParser = this.Declaration;

    if (this.tokenType === FunctionToken) {
        featureName = this.consumeFunctionName();
        valueParser = this.supportsFeature[featureName.toLowerCase()];
        if (!valueParser) {
            this.error(`Unknown supports feature ${featureName.toLowerCase()}()`);
        }
    } else {
        this.eat(LeftParenthesis);
    }

    this.skipSC();

    const value = this.parseWithFallback(
        () => {
            const startValueToken = this.tokenIndex;
            const value = valueParser.call(this);

            if (this.eof === false &&
                this.isBalanceEdge(startValueToken) === false) {
                this.error();
            }

            return value;
        },
        (startToken) => this.Raw(startToken, null, false)
    );

    if (!this.eof) {
        this.eat(RightParenthesis);
    }

    return {
        type: 'SupportsFeature',
        loc: this.getLocation(start, this.tokenStart),
        feature: featureName,
        value
    };
}

export function generate(node) {
    if (node.feature !== 'declaration') {
        this.token(FunctionToken, node.feature + '(');
    } else {
        this.token(LeftParenthesis, '(');
    }

    this.node(node.value);
    this.token(RightParenthesis, ')');
}
