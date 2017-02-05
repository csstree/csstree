var TYPE = require('../../tokenizer').TYPE;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

module.exports = function Parentheses(readSequence) {
    var start = this.scanner.tokenStart;
    var children = null;

    this.scanner.eat(LEFTPARENTHESIS);
    children = readSequence.call(this);
    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Parentheses',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
