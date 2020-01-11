const { isWhiteSpace } = require('../../tokenizer');
const {
    Function,
    Url,
    RightParenthesis
} = require('../../tokenizer/types');

// <url-token> | <function-token> <string> )
module.exports = {
    name: 'Url',
    structure: {
        value: ['String', 'Raw']
    },
    parse: function() {
        const start = this.tokenStart;
        let value;

        switch (this.tokenType) {
            case Url:
                let rawStart = start + 4;
                let rawEnd = this.tokenEnd - 1;

                while (rawStart < rawEnd && isWhiteSpace(this.charCodeAt(rawStart))) {
                    rawStart++;
                }

                while (rawStart < rawEnd && isWhiteSpace(this.charCodeAt(rawEnd - 1))) {
                    rawEnd--;
                }

                value = {
                    type: 'Raw',
                    loc: this.getLocation(rawStart, rawEnd),
                    value: this.substring(rawStart, rawEnd)
                };

                this.eat(Url);
                break;

            case Function:
                if (!this.cmpStr(this.tokenStart, this.tokenEnd, 'url(')) {
                    this.error('Function name must be `url`');
                }

                this.eat(Function);
                this.skipSC();
                value = this.String();
                this.skipSC();
                this.eat(RightParenthesis);
                break;

            default:
                this.error('Url or Function is expected');
        }

        return {
            type: 'Url',
            loc: this.getLocation(start, this.tokenStart),
            value
        };
    },
    generate: function(node) {
        this.chunk('url');
        this.chunk('(');
        this.node(node.value);
        this.chunk(')');
    }
};
