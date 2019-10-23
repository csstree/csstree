var TYPE = require('../../tokenizer').TYPE;

var IDENT = TYPE.Ident;
var NUMBER = TYPE.Number;
var DIMENSION = TYPE.Dimension;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var COLON = TYPE.Colon;
var DELIM = TYPE.Delim;

module.exports = {
    name: 'MediaFeature',
    structure: {
        name: String,
        value: ['Identifier', 'Number', 'Dimension', 'Ratio', null]
    },
    parse: function() {
        var start = this.tokenStart;
        var name;
        var value = null;

        this.eat(LEFTPARENTHESIS);
        this.skipSC();

        name = this.consume(IDENT);
        this.skipSC();

        if (this.tokenType !== RIGHTPARENTHESIS) {
            this.eat(COLON);
            this.skipSC();

            switch (this.tokenType) {
                case NUMBER:
                    if (this.lookupNonWSType(1) === DELIM) {
                        value = this.Ratio();
                    } else {
                        value = this.Number();
                    }

                    break;

                case DIMENSION:
                    value = this.Dimension();
                    break;

                case IDENT:
                    value = this.Identifier();

                    break;

                default:
                    this.error('Number, dimension, ratio or identifier is expected');
            }

            this.skipSC();
        }

        this.eat(RIGHTPARENTHESIS);

        return {
            type: 'MediaFeature',
            loc: this.getLocation(start, this.tokenStart),
            name: name,
            value: value
        };
    },
    generate: function(node) {
        this.chunk('(');
        this.chunk(node.name);
        if (node.value !== null) {
            this.chunk(':');
            this.node(node.value);
        }
        this.chunk(')');
    }
};
