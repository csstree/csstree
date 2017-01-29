var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var STRING = TYPE.String;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// url '(' ws* (string | raw) ws* ')'
module.exports = function Url(scope, start) {
    var value;

    this.scanner.eat(LEFTPARENTHESIS); // (
    this.readSC();

    if (this.scanner.tokenType === STRING) {
        value = this.String();
    } else {
        var rawStart = this.scanner.tokenStart;

        for (; !this.scanner.eof; this.scanner.next()) {
            var type = this.scanner.tokenType;

            if (type === WHITESPACE ||
                type === LEFTPARENTHESIS ||
                type === RIGHTPARENTHESIS) {
                break;
            }
        }

        value = {
            type: 'Raw',
            loc: this.getLocation(rawStart, this.scanner.tokenStart),
            value: this.scanner.substrToCursor(rawStart)
        };
    }

    this.readSC();
    this.scanner.eat(RIGHTPARENTHESIS); // )

    return {
        type: 'Url',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: value
    };
};
