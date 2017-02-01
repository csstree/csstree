var TYPE = require('../../scanner').TYPE;

var STRING = TYPE.String;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var NONBALANCED = false;

// url '(' ws* (string | raw) ws* ')'
module.exports = function Url(scope, start) {
    var value;

    this.scanner.eat(LEFTPARENTHESIS); // (
    this.readSC();

    if (this.scanner.tokenType === STRING) {
        value = this.String();
    } else {
        value = this.Raw(NONBALANCED, LEFTPARENTHESIS, RIGHTPARENTHESIS);
    }

    this.readSC();
    this.scanner.eat(RIGHTPARENTHESIS); // )

    return {
        type: 'Url',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: value
    };
};
