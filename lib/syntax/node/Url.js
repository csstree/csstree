const url = require('../../utils/url');
const string = require('../../utils/string');
const {
    Function: FunctionToken,
    String: StringToken,
    Url,
    RightParenthesis
} = require('../../tokenizer/types');

// <url-token> | <function-token> <string> )
module.exports = {
    name: 'Url',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;
        let value;

        switch (this.tokenType) {
            case Url:
                value = url.decode(this.consume(Url));
                break;

            case FunctionToken:
                if (!this.cmpStr(this.tokenStart, this.tokenEnd, 'url(')) {
                    this.error('Function name must be `url`');
                }

                this.eat(FunctionToken);
                this.skipSC();
                value = string.decode(this.consume(StringToken));
                this.skipSC();
                if (!this.eof) {
                    this.eat(RightParenthesis);
                }
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
        // if (node.value.type === 'Raw') {
        this.token(Url, url.encode(node.value));
        // } else {
        // this.token(FunctionToken, 'url(');
        // this.token(StringToken, string.encode(node.value));
        // this.token(RightParenthesis, ')');
        // }
    }
};
