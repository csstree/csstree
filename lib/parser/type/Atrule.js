var TYPE = require('../../scanner').TYPE;

var SEMICOLON = TYPE.Semicolon;
var COMMERCIALAT = TYPE.CommercialAt;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var EOF = 0;
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
    var expression = null;
    var block = null;

    this.scanner.eat(COMMERCIALAT);

    name = this.readIdent(DISALLOW_VAR);
    this.readSC();

    if (this.atrule.hasOwnProperty(name)) {
        var custom = this.atrule[name];

        if (typeof custom.expression === 'function') {
            expression = custom.expression.call(this);
            this.readSC();
        }

        if (typeof custom.block === 'function') {
            if (this.scanner.tokenType !== LEFTCURLYBRACKET) {
                this.scanner.error('Curly bracket is expected');
            }

            block = custom.block.call(this);
        } else {
            if (this.scanner.tokenType === SEMICOLON) {
                this.scanner.next();
            } else if (!this.scanner.eof) {
                this.scanner.error('Semicolon or EOF is expected');
            }
        }
    } else {
        expression = this.AtruleExpression(name);
        this.readSC();

        switch (this.scanner.tokenType) {
            case SEMICOLON:
                this.scanner.next();
                break;

            case LEFTCURLYBRACKET:
                block = this.Block(isBlockAtrule.call(this) ? this.Declaration : this.Rule);
                break;

            case EOF:
                break;

            default:
                this.scanner.error();
        }
    }

    return {
        type: 'Atrule',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        expression: expression,
        block: block
    };
};
