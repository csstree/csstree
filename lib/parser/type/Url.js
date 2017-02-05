var TYPE = require('../../tokenizer').TYPE;

var STRING = TYPE.String;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var NONBALANCED = false;

// url '(' S* (string | raw) S* ')'
module.exports = function Url() {
    var start = this.scanner.tokenStart;
    var value;

    this.scanner.expectIdentifier('url');
    this.scanner.eat(LEFTPARENTHESIS);
    this.readSC();

    if (this.scanner.tokenType === STRING) {
        value = this.String();
    } else {
        value = this.Raw(NONBALANCED, LEFTPARENTHESIS, RIGHTPARENTHESIS);
    }

    this.readSC();
    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Url',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: value
    };
};
