var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var COLON = TYPE.Colon;
var SOLIDUS = TYPE.Solidus;

module.exports = function MediaFeature() {
    var start = this.scanner.tokenStart;
    var name;
    var value = null;

    this.scanner.eat(LEFTPARENTHESIS);
    this.readSC();

    name = this.scanner.consume(IDENTIFIER);
    this.readSC();

    if (this.scanner.tokenType !== RIGHTPARENTHESIS) {
        this.scanner.eat(COLON);
        this.readSC();

        switch (this.scanner.tokenType) {
            case NUMBER:
                if (this.scanner.lookupType(1) === IDENTIFIER) {
                    value = this.Dimension();
                } else if (this.scanner.lookupNonWSType(1) === SOLIDUS) {
                    value = this.Ratio();
                } else {
                    value = this.Number();
                }

                break;

            case IDENTIFIER:
                value = this.Identifier();

                break;

            default:
                this.scanner.error('Number, dimension, ratio or identifier is expected');
        }

        this.readSC();
    }

    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'MediaFeature',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        value: value
    };
};
