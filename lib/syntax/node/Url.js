var isWhiteSpace = require('../../tokenizer').isWhiteSpace;
var TYPE = require('../../tokenizer').TYPE;

var FUNCTION = TYPE.Function;
var URL = TYPE.Url;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// <url-token> | <function-token> <string> )
module.exports = {
    name: 'Url',
    structure: {
        value: ['String', 'Raw']
    },
    parse: function() {
        var start = this.tokenStart;
        var value;

        switch (this.tokenType) {
            case URL:
                var rawStart = start + 4;
                var rawEnd = this.tokenEnd - 1;

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

                this.eat(URL);
                break;

            case FUNCTION:
                if (!this.cmpStr(this.tokenStart, this.tokenEnd, 'url(')) {
                    this.error('Function name must be `url`');
                }

                this.eat(FUNCTION);
                this.skipSC();
                value = this.String();
                this.skipSC();
                this.eat(RIGHTPARENTHESIS);
                break;

            default:
                this.error('Url or Function is expected');
        }

        return {
            type: 'Url',
            loc: this.getLocation(start, this.tokenStart),
            value: value
        };
    },
    generate: function(node) {
        this.chunk('url');
        this.chunk('(');
        this.node(node.value);
        this.chunk(')');
    }
};
