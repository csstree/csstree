var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

// ident '(' <sequence> ')'
module.exports = function Function(scope, readSequence) {
    var start = this.scanner.tokenStart;
    var name = this.scanner.consume(IDENTIFIER);
    var nameLowerCase = name.toLowerCase();
    var children;

    this.scanner.eat(LEFTPARENTHESIS);

    children = scope.hasOwnProperty(nameLowerCase)
        ? scope[nameLowerCase].call(this, scope, start, readSequence)
        : readSequence.call(this, scope);

    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Function',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children
    };
};
