var TYPE = require('../../scanner').TYPE;

var SEMICOLON = TYPE.Semicolon;
var COMMERCIALAT = TYPE.CommercialAt;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var DISALLOW_VAR = false;

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

    name = this.readIdent(DISALLOW_VAR);
    expression = this.AtruleExpression(name);

    switch (this.scanner.tokenType) {
        case SEMICOLON:
            this.scanner.next();  // ;
            break;

        case LEFTCURLYBRACKET:
            block = this.Block(isBlockAtrule.call(this) ? this.Declaration : this.Rule);
            break;

        // at-rule expression can ends with semicolon, left curly bracket or eof,
        // otherwise AtruleExpression fails therefore no other options
    }

    return {
        type: 'Atrule',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        expression: expression,
        block: block
    };
};
