var TYPE = require('../../tokenizer').TYPE;

var STRING = TYPE.String;
var URL = TYPE.Url;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var RAW = TYPE.Raw;

// url '(' S* (string | raw) S* ')'
module.exports = {
    name: 'Url',
    structure: {
        value: ['String', 'Raw']
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var value;

        this.eat(URL);
        this.scanner.skipSC();

        switch (this.scanner.tokenType) {
            case STRING:
                value = this.String();
                break;

            case RAW:
                value = this.Raw(this.scanner.tokenIndex, 0, RAW, true, false);
                break;

            default:
                this.error('String or Raw is expected');
        }

        this.scanner.skipSC();
        this.eat(RIGHTPARENTHESIS);

        return {
            type: 'Url',
            loc: this.getLocation(start, this.scanner.tokenStart),
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
