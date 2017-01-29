var TYPE = require('../../scanner').TYPE;

var SEMICOLON = TYPE.Semicolon;
var COMMERCIALAT = TYPE.CommercialAt;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var NESTED = true;

function isBlockAtrule() {
    for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTCURLYBRACKET) {
            return true;
        }

        if (type === LEFTCURLYBRACKET ||
            type === COMMERCIALAT) {
            return false;
        }
    }

    return true;
}

module.exports = function Atrule() {
    var start = this.scanner.tokenStart;
    var name;
    var expression;
    var block = null;

    this.scanner.eat(COMMERCIALAT);

    name = this.readIdent(false);
    expression = this.AtruleExpression();

    switch (this.scanner.tokenType) {
        case SEMICOLON:
            this.scanner.next();  // ;
            break;

        case LEFTCURLYBRACKET:
            block = isBlockAtrule.call(this)
                ? this.Block()
                : this.Stylesheet(NESTED);
            break;

        // at-rule expression can ends with semicolon, left curly bracket or eof - no other options
    }

    return {
        type: 'Atrule',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        expression: expression,
        block: block
    };
};
